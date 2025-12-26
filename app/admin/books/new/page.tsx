'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { MultiSelect } from '@/components/ui/multi-select';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner';

interface Item {
    id: string;
    name: string;
}

export default function NewBookPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [subjectsList, setSubjectsList] = useState<Item[]>([]);
    const [categoriesList, setCategoriesList] = useState<Item[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        price: '',
        originalPrice: '',
        description: '',
        category: '',
        categories: [] as string[],
        subject: '',
        subjects: [] as string[],

        language: 'English Medium',
        stock: '100',
        weight: '500', // Default 500g
        show: true
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Subjects
                const subjectsQuery = query(collection(db, 'subjects'), orderBy('name'));
                const subjectsSnapshot = await getDocs(subjectsQuery);
                const fetchedSubjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setSubjectsList(fetchedSubjects);

                // Fetch Categories
                const categoriesQuery = query(collection(db, 'categories'), orderBy('name'));
                const categoriesSnapshot = await getDocs(categoriesQuery);
                const fetchedCategories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setCategoriesList(fetchedCategories);
            } catch (error) {
                //console.error("Error fetching data", error);
            }
        };
        fetchData();
    }, []);

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
        setLoading(true);

        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile);
            }

            await addDoc(collection(db, 'books'), {
                title: formData.title,
                author: formData.author,
                price: Number(formData.price),
                originalPrice: Number(formData.originalPrice),
                description: formData.description,
                category: formData.categories[0] || formData.category, // Legacy support
                categories: formData.categories,
                primaryCategory: formData.categories[0] || formData.category,
                subject: formData.subjects[0] || formData.subject, // Legacy support
                subjects: formData.subjects,
                language: formData.language,
                stockQuantity: Number(formData.stock),
                weight: Number(formData.weight),
                image: imageUrl,
                rating: 0,
                reviews: 0,
                show: formData.show,
                createdAt: serverTimestamp(),
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            });

            router.push('/admin/books');
        } catch (error) {
            //console.error("Error adding book:", error);
            toast.error('Failed to add book');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <Link href="/admin/books">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Books
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Add New Book</h1>
                <p className="text-muted-foreground">Enter the details of the new book</p>
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

                    <div className="flex items-center gap-2 border p-4 rounded-lg bg-muted/20">
                        <Switch
                            id="show"
                            checked={formData.show}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show: checked }))}
                        />
                        <Label htmlFor="show" className="cursor-pointer">Visible to Public</Label>
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
                            <Label>Categories</Label>
                            <MultiSelect
                                options={categoriesList.map(c => ({ label: c.name, value: c.name }))}
                                selected={formData.categories}
                                onChange={(selected) => setFormData(prev => ({ ...prev, categories: selected }))}
                                placeholder="Select Categories"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Subjects</Label>
                        <MultiSelect
                            options={subjectsList.map(s => ({ label: s.name, value: s.name }))}
                            selected={formData.subjects}
                            onChange={(selected) => setFormData(prev => ({ ...prev, subjects: selected }))}
                            placeholder="Select Subjects"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Manage subjects and categories on the main Books page.
                        </p>
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
                            <Select
                                value={formData.language}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English Medium">English Medium</SelectItem>
                                    <SelectItem value="Telugu Medium">Telugu Medium</SelectItem>
                                    <SelectItem value="Hindi Medium">Hindi Medium</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="space-y-2">
                            <Label htmlFor="weight">Weight (in grams)</Label>
                            <Input
                                id="weight"
                                name="weight"
                                type="number"
                                value={formData.weight}
                                onChange={handleInputChange}
                                required
                                min="0"
                                placeholder="e.g. 500"
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
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="cursor-pointer"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, WEBP</p>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding Book...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Add Book
                            </>
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
