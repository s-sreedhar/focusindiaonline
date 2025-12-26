'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Plus, Search, FileText, Loader2, Download, EyeOff } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

interface TestSeries {
    id: string;
    title: string;
    description: string;
    price: number;
    fileUrl: string;
    imageUrl?: string;
    createdAt?: any;
}

export default function TestSeriesPage() {
    const [series, setSeries] = useState<TestSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
    const [uploading, setUploading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        file: null as File | null,
        image: null as File | null,
        show: true
    });

    useEffect(() => {
        fetchSeries();
    }, []);

    const fetchSeries = async () => {
        try {
            const q = query(collection(db, 'test_series'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TestSeries[];
            setSeries(data);
        } catch (error) {
            //console.error("Error fetching test series:", error);
            toast.error("Failed to fetch test series");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.price) {
            toast.error("Please fill in all text fields");
            return;
        }

        if (!editingSeries && !formData.file) {
            toast.error("Please upload a PDF file");
            return;
        }

        if (!editingSeries && !formData.image) {
            toast.error("Please upload a Thumbnail Image");
            return;
        }

        setUploading(true);
        try {
            let fileUrl = editingSeries?.fileUrl || '';
            let imageUrl = editingSeries?.imageUrl || '';

            if (formData.file) {
                // R2 Upload Logic
                // console.log("[R2 Debug] Requesting upload URL...");
                const response = await fetch('/api/upload/r2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: formData.file.name,
                        contentType: formData.file.type
                    })
                });

                if (!response.ok) throw new Error('Failed to get upload URL');

                const { uploadUrl, fileUrl: r2FileUrl } = await response.json();
                // console.log("[R2 Debug] Got upload URL:", uploadUrl);

                // Upload to R2
                // console.log("[R2 Debug] Starting PUT upload...");
                try {
                    const uploadRes = await fetch(uploadUrl, {
                        method: 'PUT',
                        body: formData.file,
                        headers: { 'Content-Type': formData.file.type }
                    });

                    if (!uploadRes.ok) {
                        //console.error("[R2 Debug] Upload failed with status:", uploadRes.status);
                        throw new Error(`R2 Upload failed: ${uploadRes.statusText}`);
                    }
                    // console.log("[R2 Debug] Upload successful");
                } catch (r2Error) {
                    //console.error("[R2 Debug] Fetch error during PUT:", r2Error);
                    throw new Error("Failed to upload file to R2 (Likely CORS or Network issue)");
                }

                // If updating and new file uploaded, delete old file from R2
                if (editingSeries?.fileUrl) {
                    try {
                        await fetch('/api/upload/r2/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fileUrl: editingSeries.fileUrl }),
                        });
                        // console.log("Old file deleted from R2");
                    } catch (err) {
                        //console.error("Failed to delete old R2 file:", err);
                    }
                }

                fileUrl = r2FileUrl;
            }

            if (formData.image) {
                imageUrl = await uploadToCloudinary(formData.image);
            }

            const seriesData = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                fileUrl,
                imageUrl,
                show: formData.show,
                updatedAt: serverTimestamp()
            };

            if (editingSeries) {
                // Delete old image if new one is uploaded
                if (formData.image && editingSeries.imageUrl) {
                    await deleteFromCloudinary(editingSeries.imageUrl);
                }

                await updateDoc(doc(db, 'test_series', editingSeries.id), seriesData);
                toast.success("Test Series updated successfully");
            } else {
                await addDoc(collection(db, 'test_series'), {
                    ...seriesData,
                    createdAt: serverTimestamp()
                });
                toast.success("Test Series created successfully");
            }

            setIsDialogOpen(false);
            resetForm();
            fetchSeries();
        } catch (error) {
            //console.error("Error saving test series:", error);
            toast.error("Failed to save test series");
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', price: '', file: null, image: null, show: true });
        setEditingSeries(null);
    };

    // Confirm Dialog
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteDoc(doc(db, 'test_series', deleteId));

            // Delete associated files from Cloudinary and R2
            const seriesToDelete = series.find(s => s.id === deleteId);

            // Delete PDF from R2
            if (seriesToDelete?.fileUrl) {
                try {
                    await fetch('/api/upload/r2/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileUrl: seriesToDelete.fileUrl }),
                    });
                } catch (err) {
                    //console.error("Failed to delete R2 file:", err);
                }
            }

            // Delete Image from Cloudinary
            if (seriesToDelete?.imageUrl) {
                await deleteFromCloudinary(seriesToDelete.imageUrl, 'image');
            }

            toast.success("Test Series deleted");
            fetchSeries();
        } catch (error) {
            //console.error("Error deleting series:", error);
            toast.error("Failed to delete test series");
        } finally {
            setDeleteId(null);
        }
    };

    const openEdit = (item: TestSeries) => {
        setEditingSeries(item);
        setFormData({
            title: item.title,
            description: item.description,
            price: item.price.toString(),
            file: null,

            image: null,
            show: (item as any).show ?? true
        });
        setIsDialogOpen(true);
    };

    const filteredSeries = series.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );



    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Test Series"
                description="Are you sure you want to delete this test series? This action cannot be undone."
                variant="destructive"
            />
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Test Series Management</h1>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Test Series
                </Button>
            </div>

            <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search test series..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>File</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSeries.map((item) => (
                                <TableRow key={item.id} className={(item as any).show === false ? 'bg-muted/50' : ''}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {item.title}
                                            {(item as any).show === false && (
                                                <div className="flex items-center gap-0.5 text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                                    <EyeOff className="w-3 h-3" />
                                                    Hidden
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={item.description}>{item.description}</TableCell>
                                    <TableCell>₹{item.price}</TableCell>
                                    <TableCell>
                                        <a
                                            href={item.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline flex items-center"
                                        >
                                            <FileText className="w-4 h-4 mr-1" /> View PDF
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredSeries.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No test series found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}

            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSeries ? 'Edit Test Series' : 'Add New Test Series'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="E.g., Complete Math Test Series"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Details about this test series..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price (₹)</Label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="499"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>PDF File {editingSeries && '(Leave empty to keep current)'}</Label>
                            <Input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                            />
                            {editingSeries?.fileUrl && !formData.file && (
                                <p className="text-xs text-muted-foreground">Current file: <a href={editingSeries.fileUrl} target="_blank" className="underline">View PDF</a></p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Thumbnail Image</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFormData({ ...formData, image: e.target.files[0] });
                                    }
                                }}
                            />
                            {editingSeries?.imageUrl && !formData.image && (
                                <img src={editingSeries.imageUrl} alt="Thumbnail" className="h-16 w-16 object-cover rounded mt-2 border" />
                            )}
                        </div>

                        <div className="flex items-center gap-2 border p-4 rounded-lg bg-muted/20">
                            <Switch
                                id="show"
                                checked={formData.show}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show: checked }))}
                            />
                            <Label htmlFor="show" className="cursor-pointer">Visible to Public</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={uploading}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {editingSeries ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
