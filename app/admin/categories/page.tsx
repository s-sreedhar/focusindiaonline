'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PRIMARY_CATEGORIES, SUBJECTS } from '@/lib/constants';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Category {
    id: string;
    name: string;
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
    const [newSubject, setNewSubject] = useState('');
    const [adding, setAdding] = useState(false);

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
        });

        // Real-time listener for Subjects
        const subQuery = query(collection(db, 'subjects'), orderBy('name'));
        const unsubscribeSub = onSnapshot(subQuery, (snapshot) => {
            const subData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
            setSubjects(subData);
            setLoading(false); // Set loading false after both (approx)
        }, (error) => {
            console.error("Error fetching subjects:", error);
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
            console.error(error);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        setAdding(true);
        try {
            await addDoc(collection(db, 'categories'), {
                name: newCategory.trim(),
                createdAt: serverTimestamp()
            });
            toast.success('Category added');
            setNewCategory('');
        } catch (error) {
            toast.error('Failed to add category');
        } finally {
            setAdding(false);
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
                    console.error(error);
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

            {/* <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
                    <p className="text-muted-foreground">Manage Categories and Subjects.</p>
                </div>
                <Button variant="outline" onClick={handleSeedData} disabled={loading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Seed Defaults
                </Button>
            </div> */}

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
                            <div className="flex gap-2">
                                <Input
                                    placeholder="New Category Name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                                <Button onClick={handleAddCategory} disabled={adding || !newCategory.trim()}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid gap-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                        <span>{cat.name}</span>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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
