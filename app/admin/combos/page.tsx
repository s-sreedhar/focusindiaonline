'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Loader2, Package, Upload, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { PRIMARY_CATEGORIES, SUBJECTS } from '@/lib/constants';
import { MultiSelect } from '@/components/ui/multi-select';

interface Book {
    id: string;
    title: string;
    price: number;
    image: string;
    author: string;
    category?: string;
    subject?: string;
}

interface Combo extends Book {
    description: string;
    comboBookIds: string[];
    isCombo: boolean;
    createdAt: any;
}

export default function CombosPage() {
    const [combos, setCombos] = useState<Combo[]>([]);
    const [books, setBooks] = useState<Book[]>([]); // All available books for selection
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        description: '',
        image: '',
        comboBookIds: [] as string[],
        categories: [] as string[],
        subjects: [] as string[]
    });

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? (book.category === selectedCategory) : true;
        const matchesSubject = selectedSubject ? (book.subject === selectedSubject) : true;
        return matchesSearch && matchesCategory && matchesSubject;
    });

    const fetchData = async () => {
        try {
            // Fetch Combos
            const combosQuery = query(collection(db, 'books'), where('isCombo', '==', true));
            const combosSnapshot = await getDocs(combosQuery);
            const combosData = combosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Combo[];

            // Sort manually since 'createdAt' might be missing on legacy or mixed types if we strictly queried
            combosData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setCombos(combosData);

            // Fetch Books for selection
            // We fetch all books to let admins choose. 
            // Optimally we should exclude combos themselves to prevent recursion, but let's just fetch all for now and filter in UI if needed.
            const booksQuery = query(collection(db, 'books'), orderBy('title'));
            const booksSnapshot = await getDocs(booksQuery);
            const booksData = booksSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as any))
                .filter(b => !b.isCombo) as Book[]; // Exclude combos from being inside other combos
            setBooks(booksData);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.price || formData.comboBookIds.length === 0) {
            toast.error('Please fill all required fields and select at least one book');
            return;
        }

        setUploading(true);
        try {
            let imageUrl = formData.image;
            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile);
            }

            const comboData = {
                title: formData.title,
                price: Number(formData.price),
                description: formData.description,
                image: imageUrl,
                comboBookIds: formData.comboBookIds,
                isCombo: true,
                category: formData.categories[0] || 'Value Bundles',
                categories: formData.categories,
                author: 'Focus India Bundle', // Default author
                stockQuantity: 999, // Virtual stock, or manageable
                language: 'English', // Default
                subject: formData.subjects[0] || 'Mixed',
                subjects: formData.subjects,
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            };

            if (editingId) {
                await updateDoc(doc(db, 'books', editingId), {
                    ...comboData,
                    updatedAt: serverTimestamp(),
                });
                toast.success('Combo updated successfully');
            } else {
                await addDoc(collection(db, 'books'), {
                    ...comboData,
                    createdAt: serverTimestamp(),
                });
                toast.success('Combo created successfully');
            }

            setFormData({
                title: '',
                price: '',
                description: '',
                image: '',
                comboBookIds: [],
                categories: [],
                subjects: []
            });
            setImageFile(null);
            setEditingId(null);
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving combo:', error);
            toast.error('Failed to save combo');
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (combo: Combo) => {
        setEditingId(combo.id);
        setFormData({
            title: combo.title,
            price: combo.price.toString(),
            description: combo.description || '',
            image: combo.image,
            comboBookIds: combo.comboBookIds || [],
            categories: (combo as any).categories || (combo.category ? [combo.category] : []),
            subjects: (combo as any).subjects || (combo.subject ? [combo.subject] : [])
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this combo?')) return;

        try {
            await deleteDoc(doc(db, 'books', id));
            toast.success('Combo deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting combo:', error);
            toast.error('Failed to delete combo');
        }
    };

    const toggleBookSelection = (bookId: string) => {
        setFormData(prev => {
            const currentIds = prev.comboBookIds;
            if (currentIds.includes(bookId)) {
                return { ...prev, comboBookIds: currentIds.filter(id => id !== bookId) };
            } else {
                return { ...prev, comboBookIds: [...currentIds, bookId] };
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Combos</h1>
                    <p className="text-muted-foreground">Create and manage bundles of books.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setFormData({
                            title: '',
                            price: '',
                            description: '',
                            image: '',
                            comboBookIds: [],
                            categories: [],
                            subjects: []
                        });
                        setImageFile(null);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Combo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Combo' : 'Create New Combo'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Combo Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. UPSC Starter Pack"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="e.g. 999"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Categories</Label>
                                <MultiSelect
                                    options={PRIMARY_CATEGORIES.map(c => ({ label: c, value: c }))}
                                    selected={formData.categories}
                                    onChange={(selected) => setFormData(prev => ({ ...prev, categories: selected }))}
                                    placeholder="Select Categories"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Subjects</Label>
                                <MultiSelect
                                    options={SUBJECTS.map(s => ({ label: s, value: s }))}
                                    selected={formData.subjects}
                                    onChange={(selected) => setFormData(prev => ({ ...prev, subjects: selected }))}
                                    placeholder="Select Subjects"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Include Books</Label>

                                {/* Filters */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <Input
                                        placeholder="Search books..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="col-span-2"
                                    />
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {PRIMARY_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                    >
                                        <option value="">All Subjects</option>
                                        {SUBJECTS.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-2">
                                    {filteredBooks.length > 0 ? (
                                        filteredBooks.map(book => (
                                            <div key={book.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                                                <input
                                                    type="checkbox"
                                                    id={`book-${book.id}`}
                                                    checked={formData.comboBookIds.includes(book.id)}
                                                    onChange={() => toggleBookSelection(book.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <label htmlFor={`book-${book.id}`} className="text-sm flex-1 cursor-pointer">
                                                    <span className="font-medium">{book.title}</span>
                                                    <span className="text-muted-foreground ml-2">₹{book.price}</span>
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-center py-4 text-muted-foreground">No books found matching filters.</p>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Selected: {formData.comboBookIds.length} books
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe this bundle..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="image">Combo Image</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="cursor-pointer"
                                    />
                                    {(formData.image || imageFile) && (
                                        <div className="relative w-16 h-16 border rounded overflow-hidden shrink-0">
                                            <Image
                                                src={imageFile ? URL.createObjectURL(imageFile) : formData.image}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button onClick={handleSubmit} disabled={uploading}>
                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Update Combo' : 'Create Combo'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : combos.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed text-lg">
                        No combos found. Create your first bundle!
                    </div>
                ) : (
                    <>
                        {combos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((combo) => (
                            <div key={combo.id} className="group relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="aspect-[16/9] relative bg-muted">
                                    {combo.image ? (
                                        <Image
                                            src={combo.image}
                                            alt={combo.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <Package className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleEdit(combo)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(combo.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg leading-tight">{combo.title}</h3>
                                        <span className="font-bold text-primary shrink-0 bg-primary/5 px-2 py-1 rounded">
                                            ₹{combo.price}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                        {combo.description || 'No description provided.'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Package className="w-3 h-3" />
                                        {combo.comboBookIds?.length || 0} Books Included
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {combos.length > itemsPerPage && (
                <div className="mt-8">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                            {[...Array(Math.ceil(combos.length / itemsPerPage))].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        isActive={currentPage === i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className="cursor-pointer"
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(combos.length / itemsPerPage), p + 1))}
                                    className={currentPage === Math.ceil(combos.length / itemsPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}