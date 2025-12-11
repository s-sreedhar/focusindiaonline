'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, Plus, Loader2, Folder, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { PRIMARY_CATEGORIES } from '@/lib/constants';

interface Category {
    id: string;
    name: string;
}

interface DependentBook {
    id: string;
    title: string;
}

export function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [open, setOpen] = useState(false);

    // Dependency Check State
    const [checkingDependencies, setCheckingDependencies] = useState(false);
    const [dependencyWarningOpen, setDependencyWarningOpen] = useState(false);
    const [dependenciesOpen, setDependenciesOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<{ id: string, name: string } | null>(null);
    const [dependentBooks, setDependentBooks] = useState<DependentBook[]>([]);

    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'categories'), orderBy('name'));
            const querySnapshot = await getDocs(q);

            const fetchedCategories: Category[] = [];
            querySnapshot.forEach((doc) => {
                fetchedCategories.push({ id: doc.id, name: doc.data().name });
            });

            if (fetchedCategories.length === 0) {
                // Seed initial categories if empty
                console.log('Seeding initial categories...');
                const seeded: Category[] = [];
                for (const name of PRIMARY_CATEGORIES) {
                    const docRef = await addDoc(collection(db, 'categories'), {
                        name,
                        createdAt: serverTimestamp()
                    });
                    seeded.push({ id: docRef.id, name });
                }
                fetchedCategories.push(...seeded.sort((a, b) => a.name.localeCompare(b.name)));
            }

            setCategories(fetchedCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        setAdding(true);
        try {
            if (categories.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
                toast.error('Category already exists');
                setAdding(false);
                return;
            }

            const docRef = await addDoc(collection(db, 'categories'), {
                name: newCategory.trim(),
                createdAt: serverTimestamp()
            });

            setCategories(prev => [...prev, { id: docRef.id, name: newCategory.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
            setNewCategory('');
            toast.success('Category added');
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Failed to add category');
        } finally {
            setAdding(false);
        }
    };

    const initiateDelete = (id: string, name: string) => {
        setCurrentCategory({ id, name });
        setDependencyWarningOpen(true);
    };

    const checkDependenciesAndProceed = async () => {
        if (!currentCategory) return;
        setDependencyWarningOpen(false);
        setCheckingDependencies(true);

        try {
            // Check if any books use this category
            // We check 'category' field (single string)
            const q = query(collection(db, 'books'), where('category', '==', currentCategory.name));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const books: DependentBook[] = [];
                snapshot.forEach(doc => {
                    books.push({ id: doc.id, title: doc.data().title });
                });
                setDependentBooks(books);
                setDependenciesOpen(true);
            } else {
                // No dependencies, proceed to delete
                await performDelete(currentCategory.id);
            }
        } catch (error) {
            console.error("Error checking dependencies:", error);
            toast.error("Failed to check dependencies");
        } finally {
            setCheckingDependencies(false);
        }
    };

    const performDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'categories', id));
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Category deleted successfully');
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Folder className="w-4 h-4 mr-2" />
                        Manage Categories
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Manage Categories</DialogTitle>
                        <DialogDescription>
                            Add or remove book categories.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <Input
                                placeholder="New Category Name"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                            />
                            <Button type="submit" size="icon" disabled={adding || !newCategory.trim()}>
                                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </form>

                        <div className="border rounded-md max-h-[300px] overflow-y-auto p-2 space-y-2">
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : categories.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground p-4">No categories found.</p>
                            ) : (
                                categories.map((category) => (
                                    <div key={category.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md group">
                                        <span className="text-sm font-medium">{category.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => initiateDelete(category.id, category.name)}
                                            disabled={checkingDependencies}
                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {checkingDependencies && currentCategory?.id === category.id ?
                                                <Loader2 className="w-4 h-4 animate-spin" /> :
                                                <X className="w-4 h-4" />
                                            }
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Warning Dialog */}
            <AlertDialog open={dependencyWarningOpen} onOpenChange={setDependencyWarningOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Warning: Potential Impact
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Deleting this category may break filters in the application if books are currently assigned to it.
                            <br /><br />
                            We will check for any books using "<strong>{currentCategory?.name}</strong>" before deleting.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={checkDependenciesAndProceed} className="bg-destructive hover:bg-destructive/90">
                            Check & Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dependencies List Dialog */}
            <Dialog open={dependenciesOpen} onOpenChange={setDependenciesOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Cannot Delete Category</DialogTitle>
                        <DialogDescription>
                            The category "<strong>{currentCategory?.name}</strong>" is currently used by the following books. Please update these books to use a different category before deleting.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 border rounded-md max-h-[200px] overflow-y-auto p-2 bg-muted/30">
                        <ul className="space-y-2">
                            {dependentBooks.map(book => (
                                <li key={book.id} className="text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                                    <span className="truncate">{book.title}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
