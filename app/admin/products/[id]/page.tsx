'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, query, orderBy, collection, getDocs } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MultiSelect } from '@/components/ui/multi-select';
import { SUBJECTS, PRIMARY_CATEGORIES } from '@/lib/constants';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        categories: [] as string[],
        language: 'English',
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false,
        subjects: [] as string[],
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'books', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || '',
                        author: data.author || '',
                        publisher: data.publisher || '',
                        description: data.description || '',
                        price: data.price?.toString() || '',
                        originalPrice: data.originalPrice?.toString() || '',
                        stockQuantity: data.stockQuantity?.toString() || '',
                        image: data.image || '',
                        primaryCategory: data.primaryCategory || '',
                        categories: data.subCategories && data.subCategories.length > 0 ? data.subCategories : (data.primaryCategory ? [data.primaryCategory] : []),
                        language: data.language || 'English',
                        inStock: data.inStock ?? true,
                        isFeatured: data.isFeatured ?? false,
                        isNewArrival: data.isNewArrival ?? false,
                        isBestSeller: data.isBestSeller ?? false,
                        subjects: data.subjects || [],
                    });
                } else {
                    alert('Product not found');
                    router.push('/admin/products');
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, router]);

    // Data states
    const [dbCategories, setDbCategories] = useState<string[]>([]);
    const [dbSubjects, setDbSubjects] = useState<string[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                // Fetch Categories
                const catQuery = query(collection(db, 'categories'), orderBy('name'));
                const catSnapshot = await getDocs(catQuery);
                const cats = catSnapshot.docs.map((doc: any) => doc.data().name as string);
                setDbCategories(cats.length > 0 ? cats : PRIMARY_CATEGORIES);

                // Fetch Subjects
                const subQuery = query(collection(db, 'subjects'), orderBy('name'));
                const subSnapshot = await getDocs(subQuery);
                const subs = subSnapshot.docs.map((doc: any) => doc.data().name as string);
                setDbSubjects(subs.length > 0 ? subs : SUBJECTS);
            } catch (error) {
                console.error('Error fetching master data:', error);
                setDbCategories(PRIMARY_CATEGORIES);
                setDbSubjects(SUBJECTS);
            }
        };
        fetchMasterData();
    }, []);

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

    const handleCategoriesChange = (selected: string[]) => {
        setFormData(prev => ({ ...prev, categories: selected, primaryCategory: selected[0] || '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const productData = {
                ...formData,
                price: Number(formData.price),
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
                stockQuantity: Number(formData.stockQuantity),
                updatedAt: serverTimestamp(),
                subCategories: formData.categories,
                primaryCategory: formData.categories[0] || '',
            };

            await updateDoc(doc(db, 'books', id), productData);
            router.push('/admin/products');
        } catch (error) {
            console.error("Error updating product:", error);
            alert('Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent">
                    <Link href="/admin/products" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Products
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Edit Product</h1>
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
                            <Label>Categories</Label>
                            <MultiSelect
                                options={dbCategories.map(c => ({ label: c, value: c }))}
                                selected={formData.categories}
                                onChange={handleCategoriesChange}
                                placeholder="Select Categories"
                            />
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
                            <Select
                                value={formData.language}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English">English</SelectItem>
                                    <SelectItem value="Hindi">Hindi</SelectItem>
                                    <SelectItem value="Telugu">Telugu</SelectItem>
                                    <SelectItem value="Tamil">Tamil</SelectItem>
                                    <SelectItem value="Kannada">Kannada</SelectItem>
                                    <SelectItem value="Malayalam">Malayalam</SelectItem>
                                    <SelectItem value="Marathi">Marathi</SelectItem>
                                    <SelectItem value="Bengali">Bengali</SelectItem>
                                    <SelectItem value="Odia">Odia</SelectItem>
                                    <SelectItem value="Urdu">Urdu</SelectItem>
                                </SelectContent>
                            </Select>
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
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
