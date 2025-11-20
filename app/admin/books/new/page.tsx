'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X } from 'lucide-react';
import { PRIMARY_CATEGORIES } from '@/lib/constants';
import Image from 'next/image';

export default function NewBookPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);

            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile);
            }

            const bookData = {
                title: formData.get('title'),
                author: formData.get('author'),
                publisher: formData.get('publisher'),
                description: formData.get('description'),
                price: Number(formData.get('price')),
                originalPrice: Number(formData.get('originalPrice')),
                mrp: Number(formData.get('mrp')),
                stockQuantity: Number(formData.get('stockQuantity')),
                primaryCategory: formData.get('primaryCategory'),
                subCategories: (formData.get('subCategories') as string).split(',').map(s => s.trim()),
                subjects: (formData.get('subjects') as string).split(',').map(s => s.trim()),
                language: formData.get('language'),
                pageCount: Number(formData.get('pageCount')),
                edition: formData.get('edition'),
                isbn: formData.get('isbn'),
                image: imageUrl,
                inStock: Number(formData.get('stockQuantity')) > 0,
                slug: (formData.get('title') as string).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                rating: 0,
                reviewCount: 0,
                isFeatured: false,
                isNewArrival: true,
                isBestSeller: false,
            };

            await addDoc(collection(db, 'books'), bookData);

            router.push('/shop');
        } catch (error) {
            console.error('Error creating book:', error);
            alert('Failed to create book. Please check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Add New Book</h1>

                    <Card className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Book Title</Label>
                                    <Input id="title" name="title" required placeholder="Enter book title" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="author">Author</Label>
                                    <Input id="author" name="author" required placeholder="Author name" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="publisher">Publisher</Label>
                                    <Input id="publisher" name="publisher" required placeholder="Publisher name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Select name="language" required defaultValue="English Medium">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="English Medium">English Medium</SelectItem>
                                            <SelectItem value="Telugu Medium">Telugu Medium</SelectItem>
                                            <SelectItem value="Hindi Medium">Hindi Medium</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" required placeholder="Book description" className="h-32" />
                            </div>

                            {/* Pricing & Stock */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Selling Price</Label>
                                    <Input id="price" name="price" type="number" required min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="originalPrice">Original Price</Label>
                                    <Input id="originalPrice" name="originalPrice" type="number" required min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mrp">MRP</Label>
                                    <Input id="mrp" name="mrp" type="number" required min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stockQuantity">Stock Quantity</Label>
                                    <Input id="stockQuantity" name="stockQuantity" type="number" required min="0" />
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="primaryCategory">Primary Category</Label>
                                    <Select name="primaryCategory" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRIMARY_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subCategories">Sub Categories (comma separated)</Label>
                                    <Input id="subCategories" name="subCategories" placeholder="Group 1, Group 2" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subjects">Subjects (comma separated)</Label>
                                <Input id="subjects" name="subjects" placeholder="History, Polity, Economy" />
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="pageCount">Page Count</Label>
                                    <Input id="pageCount" name="pageCount" type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edition">Edition</Label>
                                    <Input id="edition" name="edition" placeholder="e.g. 2nd Edition" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="isbn">ISBN</Label>
                                    <Input id="isbn" name="isbn" placeholder="ISBN Number" />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label>Book Cover Image</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {imagePreview ? (
                                        <div className="relative w-32 h-40 mx-auto">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md z-10"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm">Click or drag to upload cover image</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Creating Book...
                                        </>
                                    ) : (
                                        'Create Book'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}
