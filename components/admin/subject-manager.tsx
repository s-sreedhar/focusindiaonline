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
import { X, Plus, Loader2, Settings, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { SUBJECTS as INITIAL_SUBJECTS } from '@/lib/constants';

interface Subject {
    id: string;
    name: string;
}

interface DependentBook {
    id: string;
    title: string;
}

export function SubjectManager() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [newSubject, setNewSubject] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [open, setOpen] = useState(false);

    // Dependency Check State
    const [checkingDependencies, setCheckingDependencies] = useState(false);
    const [dependencyWarningOpen, setDependencyWarningOpen] = useState(false);
    const [dependenciesOpen, setDependenciesOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<{ id: string, name: string } | null>(null);
    const [dependentBooks, setDependentBooks] = useState<DependentBook[]>([]);

    useEffect(() => {
        if (open) {
            fetchSubjects();
        }
    }, [open]);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'subjects'), orderBy('name'));
            const querySnapshot = await getDocs(q);

            const fetchedSubjects: Subject[] = [];
            querySnapshot.forEach((doc) => {
                fetchedSubjects.push({ id: doc.id, name: doc.data().name });
            });

            if (fetchedSubjects.length === 0) {
                // Seed initial subjects if empty
                // console.log('Seeding initial subjects...');
                const seeded: Subject[] = [];
                for (const name of INITIAL_SUBJECTS) {
                    const docRef = await addDoc(collection(db, 'subjects'), {
                        name,
                        createdAt: serverTimestamp()
                    });
                    seeded.push({ id: docRef.id, name });
                }
                fetchedSubjects.push(...seeded.sort((a, b) => a.name.localeCompare(b.name)));
            }

            setSubjects(fetchedSubjects);
        } catch (error) {
            //console.error('Error fetching subjects:', error);
            toast.error('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.trim()) return;

        setAdding(true);
        try {
            if (subjects.some(s => s.name.toLowerCase() === newSubject.trim().toLowerCase())) {
                toast.error('Subject already exists');
                setAdding(false);
                return;
            }

            const docRef = await addDoc(collection(db, 'subjects'), {
                name: newSubject.trim(),
                createdAt: serverTimestamp()
            });

            setSubjects(prev => [...prev, { id: docRef.id, name: newSubject.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
            setNewSubject('');
            toast.success('Subject added');
        } catch (error) {
            //console.error('Error adding subject:', error);
            toast.error('Failed to add subject');
        } finally {
            setAdding(false);
        }
    };

    const initiateDelete = (id: string, name: string) => {
        setCurrentSubject({ id, name });
        setDependencyWarningOpen(true);
    };

    const checkDependenciesAndProceed = async () => {
        if (!currentSubject) return;
        setDependencyWarningOpen(false);
        setCheckingDependencies(true);

        try {
            // Check if any books use this subject
            // We check 'subjects' array which is used for filtering
            const q = query(collection(db, 'books'), where('subjects', 'array-contains', currentSubject.name));
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
                await performDelete(currentSubject.id);
            }
        } catch (error) {
            //console.error("Error checking dependencies:", error);
            toast.error("Failed to check dependencies");
        } finally {
            setCheckingDependencies(false);
        }
    };

    const performDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'subjects', id));
            setSubjects(subjects.filter(s => s.id !== id));
            toast.success('Subject deleted successfully');
        } catch (error) {
            //console.error('Error deleting subject:', error);
            toast.error('Failed to delete subject');
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Subjects
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Manage Subjects</DialogTitle>
                        <DialogDescription>
                            Add or remove subjects used in book categorization.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <form onSubmit={handleAddSubject} className="flex gap-2">
                            <Input
                                placeholder="New Subject Name"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                            />
                            <Button type="submit" size="icon" disabled={adding || !newSubject.trim()}>
                                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </form>

                        <div className="border rounded-md max-h-[300px] overflow-y-auto p-2 space-y-2">
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : subjects.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground p-4">No subjects found.</p>
                            ) : (
                                subjects.map((subject) => (
                                    <div key={subject.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md group">
                                        <span className="text-sm font-medium">{subject.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => initiateDelete(subject.id, subject.name)}
                                            disabled={checkingDependencies}
                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {checkingDependencies && currentSubject?.id === subject.id ?
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
                            Deleting this subject may break filters in the application if books are currently assigned to it.
                            <br /><br />
                            We will check for any books using "<strong>{currentSubject?.name}</strong>" before deleting.
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
                        <DialogTitle className="text-destructive">Cannot Delete Subject</DialogTitle>
                        <DialogDescription>
                            The subject "<strong>{currentSubject?.name}</strong>" is currently used by the following books. Please update these books to use a different subject before deleting.
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
