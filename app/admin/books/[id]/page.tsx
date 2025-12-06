'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    // Unwrap params using React.use()
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        price: '',
        originalPrice: '',
        description: '',
        category: '',
        subject: '',
        language: 'English Medium',
        stock: '100'
    });

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const docRef = doc(db, 'books', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || '',
                        author: data.author || '',
                        price: data.price?.toString() || '',
                        originalPrice: data.originalPrice?.toString() || '',
                        description: data.description || '',
                        category: data.category || '',
                        subject: data.subject || '',
                        language: data.language || 'English Medium',
                        stock: data.stockQuantity?.toString() || '0'
                    });
                    setCurrentImageUrl(data.image || '');
                } else {
                    toast.error('Book not found');
                    router.push('/admin/books');
                }
            } catch (error) {
                console.error("Error fetching book:", error);
                toast.error('Failed to fetch book details');
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [id, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        setSaving(true);

        try {
            let imageUrl = currentImageUrl;
            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile);
            }

            await updateDoc(doc(db, 'books', id), {
                title: formData.title,
                author: formData.author,
                price: Number(formData.price),
                originalPrice: Number(formData.originalPrice),
                description: formData.description,
                category: formData.category,
                subject: formData.subject,
                language: formData.language,
                stockQuantity: Number(formData.stock),
                image: imageUrl,
                updatedAt: serverTimestamp(),
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            });

            toast.success('Book updated successfully');
            router.push('/admin/books');
        } catch (error) {
            console.error("Error updating book:", error);
            toast.error('Failed to update book');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <Link href="/admin/books">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Books
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Edit Book</h1>
                <p className="text-muted-foreground">Update book details</p>
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Book Title</Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Indian Polity 6th Edition"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="author">Author/Publisher</Label>
                            <Input
                                id="author"
                                name="author"
                                value={formData.author}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. M. Laxmikanth"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="UPSC">UPSC</option>
                                <option value="SSC">SSC</option>
                                <option value="RRB">RRB</option>
                                <option value="BANKING">Banking</option>
                                <option value="APPSC">APPSC</option>
                                <option value="TSPSC">TSPSC</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Selling Price (₹)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                required
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="originalPrice">MRP (₹)</Label>
                            <Input
                                id="originalPrice"
                                name="originalPrice"
                                type="number"
                                value={formData.originalPrice}
                                onChange={handleInputChange}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <select
                                id="language"
                                name="language"
                                value={formData.language}
                                onChange={handleInputChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="English Medium">English Medium</option>
                                <option value="Telugu Medium">Telugu Medium</option>
                                <option value="Hindi Medium">Hindi Medium</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock Quantity</Label>
                            <Input
                                id="stock"
                                name="stock"
                                type="number"
                                value={formData.stock}
                                onChange={handleInputChange}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            placeholder="Book description..."
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Book Cover Image</Label>
                        <div className="flex items-center gap-4">
                            {currentImageUrl && (
                                <div className="relative w-20 h-28 border rounded overflow-hidden">
                                    <img src={currentImageUrl} alt="Current cover" className="object-cover w-full h-full" />
                                </div>
                            )}
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="cursor-pointer flex-1"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, WEBP</p>
                    </div>

                    <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating Book...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Update Book
                            </>
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
