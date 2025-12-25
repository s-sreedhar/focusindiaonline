'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Trash2, ArrowUp, ArrowDown, User, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Image from 'next/image';
import { toast } from 'sonner';

interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    avatarUrl: string;
    rating: number;
    order: number;
    createdAt: any;
}

export default function TestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        content: '',
        rating: 5
    });

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const q = query(collection(db, 'reviews'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Testimonial[];

            // Sort by order 
            data.sort((a, b) => {
                const orderA = a.order ?? 999;
                const orderB = b.order ?? 999;
                return orderA - orderB;
            });

            setTestimonials(data);
        } catch (error) {
            //console.error("Error fetching testimonials:", error);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Avatar is optional, use placeholder if missing
        let avatarUrl = '';

        setUploading(true);

        try {
            if (imageFile) {
                avatarUrl = await uploadToCloudinary(imageFile);
            } else {
                // Generate UI Avatars URL
                avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`;
            }

            // Get the highest order number
            const newOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.order || 0)) + 1 : 0;

            await addDoc(collection(db, 'reviews'), {
                ...formData,
                rating: Number(formData.rating),
                avatarUrl,
                order: newOrder,
                createdAt: serverTimestamp()
            });

            toast.success("Review added successfully");
            setFormData({ name: '', role: '', content: '', rating: 5 });
            setImageFile(null);
            const fileInput = document.getElementById('image') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            fetchTestimonials();
        } catch (error) {
            //console.error("Error adding testimonial:", error);
            toast.error("Failed to add review");
        } finally {
            setUploading(false);
        }
    };

    // Confirm Dialog
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteDoc(doc(db, 'reviews', deleteId));

            // Delete associated image if exists
            const review = testimonials.find(t => t.id === deleteId);
            if (review?.avatarUrl && review.avatarUrl.includes('cloudinary')) {
                // We can import deleteFromCloudinary if we want strict cleanup, but staying focused on Dialog for now.
                // Actually the user just asked for "Custom pop up". 
                // But cleaning up is good. I'll stick to just the Dialog as requested to minimize scope creep unless I already imported it.
            }

            toast.success("Review deleted successfully");
            setTestimonials(prev => prev.filter(t => t.id !== deleteId));
        } catch (error) {
            //console.error("Error deleting testimonial:", error);
            toast.error("Failed to delete review");
        } finally {
            setDeleteId(null);
        }
    };

    const moveTestimonial = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === testimonials.length - 1)
        ) {
            return;
        }

        const newTestimonials = [...testimonials];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newTestimonials[index], newTestimonials[targetIndex]] = [newTestimonials[targetIndex], newTestimonials[index]];

        setTestimonials(newTestimonials);

        try {
            const batch = writeBatch(db);
            newTestimonials.forEach((t, i) => {
                const ref = doc(db, 'reviews', t.id);
                batch.update(ref, { order: i });
            });
            await batch.commit();
            toast.success("Order updated");
        } catch (error) {
            //console.error("Error updating order:", error);
            toast.error("Failed to update order");
            fetchTestimonials();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Customer Reviews Management</h1>
                <p className="text-muted-foreground">Manage customer reviews displayed on the home page</p>
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Review"
                description="Are you sure you want to delete this review? This action cannot be undone."
                variant="destructive"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">Add New Testimonial</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Rahul Kumar"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role / Designation</Label>
                                <Input
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    placeholder="e.g. UPSC Aspirant"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rating">Rating (1-5)</Label>
                                <Input
                                    id="rating"
                                    name="rating"
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.rating}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Review Content</Label>
                                <Textarea
                                    id="content"
                                    name="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    placeholder="What did they say?"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Avatar (Optional)</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="cursor-pointer"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Add Testimonial
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Existing Testimonials</h2>
                    {testimonials.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">
                            No testimonials found. Add one to get started.
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {testimonials.map((testimonial, index) => (
                                <Card key={testimonial.id} className="p-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex flex-col gap-1 mt-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={index === 0}
                                                onClick={() => moveTestimonial(index, 'up')}
                                                className="h-6 w-6"
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={index === testimonials.length - 1}
                                                onClick={() => moveTestimonial(index, 'down')}
                                                className="h-6 w-6"
                                            >
                                                <ArrowDown className="w-3 h-3" />
                                            </Button>
                                        </div>

                                        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border">
                                            <Image
                                                src={testimonial.avatarUrl}
                                                alt={testimonial.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold">{testimonial.name}</h3>
                                                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                                </div>
                                                <div className="flex items-center text-yellow-500">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span className="text-sm ml-1">{testimonial.rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm mt-2 text-gray-700 line-clamp-2">
                                                "{testimonial.content}"
                                            </p>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDeleteClick(testimonial.id)}
                                            className="shrink-0 h-8 w-8"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
