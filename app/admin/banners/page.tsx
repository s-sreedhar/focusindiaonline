'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loader2, Upload, Trash2, Image as ImageIcon, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { deleteFromCloudinary, uploadToCloudinary } from '@/lib/cloudinary';
import Image from 'next/image';
import { toast } from 'sonner';

interface Banner {
    id: string;
    imageUrl: string;
    title: string;
    link: string;
    order: number;
    createdAt: any;
}

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        link: ''
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const q = query(collection(db, 'banners'));
            const querySnapshot = await getDocs(q);
            const bannersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Banner[];

            // Sort by order (if exists) or fallback to createdAt
            bannersData.sort((a, b) => {
                const orderA = a.order ?? 999;
                const orderB = b.order ?? 999;
                return orderA - orderB;
            });

            setBanners(bannersData);
        } catch (error) {
            //console.error("Error fetching banners:", error);
            toast.error("Failed to load banners");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (!imageFile) {
            toast.error("Please select an image");
            return;
        }

        setUploading(true);

        try {
            const imageUrl = await uploadToCloudinary(imageFile);

            // Get the highest order number
            const newOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order || 0)) + 1 : 0;

            await addDoc(collection(db, 'banners'), {
                imageUrl,
                title: formData.title,
                link: formData.link,
                order: newOrder,
                createdAt: serverTimestamp()
            });

            toast.success("Banner added successfully");
            setFormData({ title: '', link: '' });
            setImageFile(null);
            // Reset file input
            const fileInput = document.getElementById('image') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            fetchBanners();
        } catch (error) {
            //console.error("Error adding banner:", error);
            toast.error("Failed to add banner");
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
            await deleteDoc(doc(db, 'banners', deleteId));

            try {
                if (bannerToDelete?.imageUrl) {
                    await deleteFromCloudinary(bannerToDelete.imageUrl);
                }
            } catch (err) {
                console.error("Cloudinary delete failed:", err);
            }

            setBanners(prev => prev.filter(banner => banner.id !== deleteId));
            toast.success("Banner deleted successfully");
        } catch (error) {
            //console.error("Error deleting banner:", error);
            toast.error("Failed to delete banner");
            //console.error("Error deleting banner:", error);
            toast.error("Failed to delete banner");
        } finally {
            setDeleteId(null);
        }
    };

    const moveBanner = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === banners.length - 1)
        ) {
            return;
        }

        const newBanners = [...banners];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap items in array
        [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];

        // Optimistically update UI
        setBanners(newBanners);

        try {
            const batch = writeBatch(db);

            // Update orders in Firestore
            // We assign order based on the new array index to ensure consistency
            newBanners.forEach((banner, i) => {
                const bannerRef = doc(db, 'banners', banner.id);
                batch.update(bannerRef, { order: i });
            });

            await batch.commit();
            toast.success("Order updated");
        } catch (error) {
            //console.error("Error updating order:", error);
            toast.error("Failed to update order");
            fetchBanners(); // Revert on error
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
                <h1 className="text-3xl font-bold">Banner Management</h1>
                <p className="text-muted-foreground">Manage the hero slider images on the home page</p>
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Banner"
                description="Are you sure you want to delete this banner? This action cannot be undone."
                variant="destructive"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">Add New Banner</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title (Optional)</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Big Sale"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="link">Link URL (Optional)</Label>
                                <Input
                                    id="link"
                                    name="link"
                                    value={formData.link}
                                    onChange={handleInputChange}
                                    placeholder="e.g. /shop/UPSC"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Banner Image</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Recommended size: 1920x600px</p>
                            </div>

                            <Button type="submit" className="w-full" disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Add Banner
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Banners List */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Existing Banners</h2>
                    {banners.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">
                            No banners found. Add one to get started.
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {banners.map((banner, index) => (
                                <Card key={banner.id} className="p-4 overflow-hidden group">
                                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                        <div className="flex flex-col gap-1 mr-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={index === 0}
                                                onClick={() => moveBanner(index, 'up')}
                                                className="h-8 w-8"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={index === banners.length - 1}
                                                onClick={() => moveBanner(index, 'down')}
                                                className="h-8 w-8"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="relative w-full md:w-48 aspect-[3/1] bg-gray-100 rounded-md overflow-hidden">
                                            <Image
                                                src={banner.imageUrl}
                                                alt={banner.title || 'Banner'}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold truncate">{banner.title || 'Untitled Banner'}</h3>
                                            {banner.link && (
                                                <div className="flex items-center gap-1 text-sm text-primary truncate">
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span className="truncate">{banner.link}</span>
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Added: {banner.createdAt?.seconds ? new Date(banner.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </p>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDeleteClick(banner.id)}
                                            className="shrink-0"
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
