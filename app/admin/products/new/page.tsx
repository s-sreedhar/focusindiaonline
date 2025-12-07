'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MultiSelect } from '@/components/ui/multi-select';
import { SUBJECTS } from '@/lib/constants';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        publisher: '',
        description: '',
        price: '',
        originalPrice: '',
        stockQuantity: '',
        image: '',
        primaryCategory: '',
        language: 'English',
        inStock: true,
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: false,
        subjects: [] as string[],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubjectsChange = (selected: string[]) => {
        setFormData(prev => ({ ...prev, subjects: selected }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const productData = {
                ...formData,
                price: Number(formData.price),
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
                stockQuantity: Number(formData.stockQuantity),
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                subCategories: [],
                // subjects is already in formData
            };

            await addDoc(collection(db, 'books'), productData);
            router.push('/admin/products');
        } catch (error) {
            console.error("Error creating product:", error);
            alert('Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent">
                    <Link href="/admin/products" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Products
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Add New Product</h1>
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="author">Author</Label>
                            <Input id="author" name="author" value={formData.author} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="publisher">Publisher</Label>
                            <Input id="publisher" name="publisher" value={formData.publisher} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="primaryCategory">Category</Label>
                            <Input id="primaryCategory" name="primaryCategory" value={formData.primaryCategory} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price (₹)</Label>
                            <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="originalPrice">Original Price</Label>
                            <Input id="originalPrice" name="originalPrice" type="number" value={formData.originalPrice} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stockQuantity">Stock Quantity</Label>
                            <Input id="stockQuantity" name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Input id="language" name="language" value={formData.language} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Subjects</Label>
                        <MultiSelect
                            options={SUBJECTS.map(s => ({ label: s, value: s }))}
                            selected={formData.subjects}
                            onChange={handleSubjectsChange}
                            placeholder="Select subjects..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Image URL</Label>
                        <Input id="image" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="inStock" checked={formData.inStock} onCheckedChange={(c) => handleSwitchChange('inStock', c)} />
                            <Label htmlFor="inStock">In Stock</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="isFeatured" checked={formData.isFeatured} onCheckedChange={(c) => handleSwitchChange('isFeatured', c)} />
                            <Label htmlFor="isFeatured">Featured</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="isNewArrival" checked={formData.isNewArrival} onCheckedChange={(c) => handleSwitchChange('isNewArrival', c)} />
                            <Label htmlFor="isNewArrival">New Arrival</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="isBestSeller" checked={formData.isBestSeller} onCheckedChange={(c) => handleSwitchChange('isBestSeller', c)} />
                            <Label htmlFor="isBestSeller">Best Seller</Label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Product
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
