'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Trash2, FileText, Image as ImageIcon, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { uploadToR2, deleteFromR2 } from '@/lib/r2-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { toast } from 'sonner';

export interface MediaItem {
    id: string;
    title: string;
    url: string;
    type: 'image' | 'document';
    format: string;
    size: number;
    createdAt: any;
}

export default function MediaLibraryPage() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'image' | 'document'>('all');

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        try {
            const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MediaItem[];
            setMediaItems(data);
        } catch (error) {
            //console.error("Error fetching media:", error);
            toast.error("Failed to load media items");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (!title) {
                // Auto-fill title with filename (without extension)
                setTitle(selectedFile.name.split('.').slice(0, -1).join('.'));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || !title) {
            toast.error("Please provide a title and select a file");
            return;
        }

        setUploading(true);

        try {
            const url = await uploadToR2(file);
            const isImage = file.type.startsWith('image/');

            await addDoc(collection(db, 'media'), {
                title,
                url,
                type: isImage ? 'image' : 'document',
                format: file.type,
                size: file.size,
                createdAt: serverTimestamp()
            });

            toast.success("Media uploaded successfully");
            setTitle('');
            setFile(null);

            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            fetchMedia();
        } catch (error) {
            //console.error("Error uploading media:", error);
            toast.error("Failed to upload media");
        } finally {
            setUploading(false);
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        try {
            const item = mediaItems.find(m => m.id === deleteId);
            if (item) {
                // Delete from R2 first
                await deleteFromR2(item.url);
                // Then delete from Firestore
                await deleteDoc(doc(db, 'media', deleteId));

                toast.success("Media deleted successfully");
                setMediaItems(prev => prev.filter(m => m.id !== deleteId));
            }
        } catch (error) {
            //console.error("Error deleting media:", error);
            toast.error("Failed to delete media");
        } finally {
            setDeleteId(null);
        }
    };

    const filteredMedia = mediaItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.url.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Media"
                description="Are you sure you want to delete this file? This will permanently remove it from Cloudflare storage and could break links where it's currently used."
                variant="destructive"
            />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Media Library</h1>
                    <p className="text-muted-foreground">Manage your images and documents in Cloudflare R2</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-24">
                        <h2 className="text-xl font-bold mb-4">Upload New Media</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter file title"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="file-upload">File</Label>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Media Grid */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search media by title or filename..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)} className="w-full sm:w-auto">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="image">Images</TabsTrigger>
                                <TabsTrigger value="document">Documents</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {filteredMedia.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">
                            No media items found.
                        </Card>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredMedia.map((item) => {
                                const filename = item.url.split('/').pop() || 'Unknown File';
                                return (
                                    <Card key={item.id} className="overflow-hidden flex flex-col group relative shadow-sm hover:shadow-md transition-shadow">
                                        <div className="aspect-video bg-muted/30 flex items-center justify-center relative border-b">
                                            {item.type === 'image' ? (
                                                <Image
                                                    src={item.url}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                                        <FileText className="w-8 h-8 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-semibold uppercase tracking-wider">{item.format.split('/')[1] || 'DOC'}</span>
                                                </div>
                                            )}

                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => window.open(item.url, '_blank')}
                                                    className="shadow-lg"
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="shadow-lg"
                                                    onClick={() => setDeleteId(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white">
                                            <h3 className="font-semibold text-sm truncate text-gray-900" title={item.title}>
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5" title={decodeURIComponent(filename)}>
                                                {decodeURIComponent(filename)}
                                            </p>
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 border-t pt-2">
                                                <span className="truncate max-w-[80px] font-medium">{formatBytes(item.size)}</span>
                                                <span className="flex items-center font-medium bg-muted/50 px-1.5 py-0.5 rounded">
                                                    {item.type === 'image' ? <ImageIcon className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                                                    {item.type}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
