'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, RefreshCw, Loader2, Edit2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PRIMARY_CATEGORIES, SUBJECTS } from '@/lib/constants';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MediaSelector } from '@/components/admin/media-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Category {
    id: string;
    name: string;
    image?: string;
    createdAt: any;
}

interface Subject {
    id: string;
    name: string;
    createdAt: any;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryUrl, setNewCategoryUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [adding, setAdding] = useState(false);

    // Edit State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editImageUrl, setEditImageUrl] = useState('');

    // Dialog States
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<{
        title: string;
        description: string;
        action: () => Promise<void>;
        variant?: 'default' | 'destructive';
    }>({ title: '', description: '', action: async () => { } });

    useEffect(() => {
        setLoading(true);
        // Real-time listener for Categories
        const catQuery = query(collection(db, 'categories'), orderBy('name'));
        const unsubscribeCat = onSnapshot(catQuery, (snapshot) => {
            const catData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
            setCategories(catData);
        }, (error) => {
            console.error("Error fetching categories:", error);
        });

        // Real-time listener for Subjects
        const subQuery = query(collection(db, 'subjects'), orderBy('name'));
        const unsubscribeSub = onSnapshot(subQuery, (snapshot) => {
            const subData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
            setSubjects(subData);
            setLoading(false); // Set loading false after both (approx)
        }, (error) => {
            //console.error("Error fetching subjects:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeCat();
            unsubscribeSub();
        };
    }, []);

    const openConfirm = (title: string, description: string, action: () => Promise<void>, variant: 'default' | 'destructive' = 'default') => {
        setDialogConfig({ title, description, action, variant });
        setDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        try {
            await dialogConfig.action();
            setDialogOpen(false);
        } catch (error) {
            //console.error(error);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        setAdding(true);
        setUploading(true);
        try {
            let imageUrl = newCategoryUrl;

            await addDoc(collection(db, 'categories'), {
                name: newCategory.trim(),
                image: imageUrl,
                createdAt: serverTimestamp()
            });
            toast.success('Category added');
            setNewCategory('');
            setNewCategoryUrl('');

        } catch (error) {
            toast.error('Failed to add category');
            //console.error(error);
        } finally {
            setAdding(false);
            setUploading(false);
        }
    };

    const handleAddSubject = async () => {
        if (!newSubject.trim()) return;
        setAdding(true);
        try {
            await addDoc(collection(db, 'subjects'), {
                name: newSubject.trim(),
                createdAt: serverTimestamp()
            });
            toast.success('Subject added');
            setNewSubject('');
        } catch (error) {
            toast.error('Failed to add subject');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteCategory = (id: string, name: string) => {
        openConfirm(
            'Delete Category',
            `Are you sure you want to delete "${name}"? This cannot be undone.`,
            async () => {
                const catToDelete = categories.find(c => c.id === id);

                await deleteDoc(doc(db, 'categories', id));
                toast.success('Category deleted');
            },
            'destructive'
        );
    };

    const handleDeleteSubject = (id: string, name: string) => {
        openConfirm(
            'Delete Subject',
            `Are you sure you want to delete "${name}"? This cannot be undone.`,
            async () => {
                await deleteDoc(doc(db, 'subjects', id));
                toast.success('Subject deleted');
            },
            'destructive'
        );
    };

    const openEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setEditName(cat.name);
        setEditImageUrl(cat.image || '');
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editName.trim()) return;

        setUploading(true);
        try {
            let imageUrl = editImageUrl;

            await updateDoc(doc(db, 'categories', editingCategory.id), {
                name: editName.trim(),
                image: imageUrl
            });

            toast.success('Category updated');
            setEditingCategory(null);
        } catch (error) {
            //console.error(error);
            toast.error('Failed to update category');
        } finally {
            setUploading(false);
        }
    };

    const handleSeedData = () => {
        openConfirm(
            'Seed Default Data',
            'This will add all default categories and subjects from the system constants to the database. Existing items will be skipped.',
            async () => {
                setLoading(true);
                try {
                    // Seed Categories
                    const catPromises = PRIMARY_CATEGORIES.map(async (cat) => {
                        const exists = categories.some(c => c.name === cat);
                        if (!exists) {
                            return addDoc(collection(db, 'categories'), {
                                name: cat,
                                createdAt: serverTimestamp()
                            });
                        }
                    });

                    // Seed Subjects
                    const subPromises = SUBJECTS.map(async (sub) => {
                        const exists = subjects.some(s => s.name === sub);
                        if (!exists) {
                            return addDoc(collection(db, 'subjects'), {
                                name: sub,
                                createdAt: serverTimestamp()
                            });
                        }
                    });

                    await Promise.all([...catPromises, ...subPromises]);
                    toast.success('Data seeded successfully');
                } catch (error) {
                    //console.error(error);
                    toast.error('Failed to seed data');
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={handleConfirmAction}
                title={dialogConfig.title}
                description={dialogConfig.description}
                variant={dialogConfig.variant}
                loading={loading && dialogOpen} // Simple loading state for dialog
            />

            {/* Edit Dialog */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category Name</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Category Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category Image</Label>
                            <div className="flex flex-col gap-4">
                                <MediaSelector
                                    type="image"
                                    onSelect={(url) => setEditImageUrl(_ => url)}
                                    selectedUrl={editImageUrl}
                                    triggerText={editImageUrl ? "Change Image" : "Select from Media Library"}
                                />
                                {editImageUrl && (
                                    <div className="w-32 h-32 rounded overflow-hidden border">
                                        <img src={editImageUrl} alt="Current" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                        <Button onClick={handleUpdateCategory} disabled={uploading || !editName.trim()}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="categories">
                <TabsList>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="subjects">Subjects</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="New Category Name"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="flex-1"
                                    />
                                    <div className="flex-1 flex flex-col justify-center">
                                        <MediaSelector
                                            type="image"
                                            onSelect={(url) => setNewCategoryUrl(_ => url)}
                                            selectedUrl={newCategoryUrl}
                                            triggerText={newCategoryUrl ? "Change Image" : "Select from Media Library"}
                                        />
                                    </div>
                                    <Button onClick={handleAddCategory} disabled={adding || !newCategory.trim() || uploading}>
                                        {uploading && !editingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>

                                </div>
                                <p className="text-xs text-muted-foreground">Upload an image for the category (optional, recommended for Home page display).</p>
                            </div>

                            <div className="grid gap-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            {/* @ts-ignore */}
                                            {cat.image ? (
                                                <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <span className="font-medium">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openEditCategory(cat)}>
                                                <Edit2 className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {categories.length === 0 && !loading && (
                                    <p className="text-muted-foreground text-sm text-center py-4">No categories found. Seed defaults or add one.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subjects" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subjects</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="New Subject Name"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                />
                                <Button onClick={handleAddSubject} disabled={adding || !newSubject.trim()}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid gap-2">
                                {subjects.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                        <span>{sub.name}</span>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(sub.id, sub.name)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {subjects.length === 0 && !loading && (
                                    <p className="text-muted-foreground text-sm text-center py-4">No subjects found. Seed defaults or add one.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
