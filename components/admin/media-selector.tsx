'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Search, Image as ImageIcon, FileText, Check, Upload } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { uploadToR2 } from '@/lib/r2-upload';
import Image from 'next/image';
import { toast } from 'sonner';
import { MediaItem } from '@/app/admin/media/page';

interface MediaSelectorProps {
    onSelect: (url: string) => void;
    type?: 'image' | 'document' | 'all';
    triggerText?: string;
    triggerIcon?: React.ReactNode;
    selectedUrl?: string | null;
}

export function MediaSelector({
    onSelect,
    type = 'all',
    triggerText = 'Select from Media Library',
    triggerIcon = <ImageIcon className="w-4 h-4 mr-2" />,
    selectedUrl
}: MediaSelectorProps) {
    const [open, setOpen] = useState(false);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'image' | 'document'>('all');
    const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');

    // Upload state
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (open && mediaItems.length === 0) {
            fetchMedia();
        }
    }, [open]);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MediaItem[];
            setMediaItems(data);
        } catch (error) {
            console.error("Error fetching media:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Apply filtering logic based on picker type constraints
            if (type === 'image' && !file.type.startsWith('image/')) {
                toast.error("Please select an image file.");
                return;
            } else if (type === 'document' && file.type.startsWith('image/')) {
                 toast.error("Please select a document file.");
                return;
            }

            setUploadFile(file);
            if (!uploadTitle) {
                setUploadTitle(file.name.split('.').slice(0, -1).join('.'));
            }
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!uploadFile || !uploadTitle) {
            toast.error("Please provide a title and select a file");
            return;
        }

        setUploading(true);

        try {
            const url = await uploadToR2(uploadFile);
            const isImage = uploadFile.type.startsWith('image/');

            const mediaData = {
                title: uploadTitle,
                url,
                type: isImage ? ('image' as const) : ('document' as const),
                format: uploadFile.type,
                size: uploadFile.size,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'media'), mediaData);

            toast.success("Media uploaded successfully");
            
            // Manually update the media items list to include the new item immediately
            const newItem: MediaItem = {
                id: docRef.id,
                ...mediaData,
                createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } // Mock timestamp for immediate UI use
            };
            
            setMediaItems(prev => [newItem, ...prev]);

            // Clear upload states first
            setUploadTitle('');
            setUploadFile(null);
            setUploading(false);

            // Auto Select and close - with a small delay to ensure states are settled
            setTimeout(() => {
                handleSelect(url);
            }, 100);
            
            // Background refresh to get the real server timestamped data
            fetchMedia();
            
        } catch (error) {
            console.error("Error uploading inline media:", error);
            toast.error("Failed to upload media");
            setUploading(false);
        }
    };

    const filteredMedia = mediaItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.url.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPropType = type === 'all' || item.type === type;
        const matchesLocalFilter = filterType === 'all' || item.type === filterType;

        return matchesSearch && matchesPropType && matchesLocalFilter;
    });

    const handleSelect = (url: string) => {
        onSelect(url);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" type="button" className="w-full">
                    {triggerIcon}
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col pt-8">
                <DialogHeader className="mb-4">
                    <DialogTitle>Media Library</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'upload')} className="flex flex-col flex-1 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="library">Library</TabsTrigger>
                        <TabsTrigger value="upload">Upload New</TabsTrigger>
                    </TabsList>

                    {/* LIBRARY TAB */}
                    <TabsContent value="library" className="flex flex-col flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
                        <div className="flex flex-col sm:flex-row gap-4 w-full mb-4 shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search media by title or filename..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {type === 'all' && (
                                <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)} className="w-[300px]">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="image">Images</TabsTrigger>
                                        <TabsTrigger value="document">Docs</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center items-center h-full min-h-[400px]">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : filteredMedia.length === 0 ? (
                                <div className="flex justify-center items-center h-full min-h-[400px] text-muted-foreground flex-col gap-2">
                                    <ImageIcon className="w-12 h-12 opacity-50" />
                                    <p>No media found. Go to Upload New to add files.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
                                    {filteredMedia.map((item) => {
                                        const isSelected = selectedUrl === item.url;
                                        const filename = item.url.split('/').pop() || 'Unknown File';

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelect(item.url)}
                                                className={`
                                                    cursor-pointer overflow-hidden flex flex-col rounded-md border-2 transition-all group
                                                    ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30 bg-muted/30'}
                                                `}
                                            >
                                                <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
                                                    {item.type === 'image' ? (
                                                        <Image
                                                            src={item.url}
                                                            alt={item.title}
                                                            fill
                                                            className={`object-cover ${isSelected ? 'opacity-80' : ''}`}
                                                        />
                                                    ) : (
                                                        <FileText className="w-10 h-10 text-muted-foreground" />
                                                    )}

                                                    {/* Selection indicator */}
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}

                                                    {/* Hover overlay hint */}
                                                    {!isSelected && (
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white text-xs font-semibold">Select</span>
                                                        </div>
                                                    )}
                                        </div>
                                        <div className="p-2 border-t bg-background">
                                            <h3 className="text-[13px] font-medium truncate" title={item.title}>
                                                {item.title}
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground truncate mt-0.5" title={decodeURIComponent(filename)}>
                                                {decodeURIComponent(filename)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                    </TabsContent>

                    {/* UPLOAD TAB */}
                    <TabsContent value="upload" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
                         <div className="h-full flex flex-col justify-center items-center py-4">
                            <Card className="p-6 w-full max-w-md shadow-none border-dashed border-2">
                                <h2 className="text-xl font-bold mb-4 text-center">Upload New File</h2>
                                <form onSubmit={handleUploadSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="upload-title">File Title</Label>
                                        <Input
                                            id="upload-title"
                                            value={uploadTitle}
                                            onChange={(e) => setUploadTitle(e.target.value)}
                                            placeholder="Enter descriptive title"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="file-input">Select File</Label>
                                        <Input
                                            id="file-input"
                                            type="file"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                            accept={type === 'image' ? 'image/*' : type === 'document' ? '.pdf,.doc,.docx,.xls,.xlsx' : '*/*'}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {type === 'image' ? 'Images only' : type === 'document' ? 'Documents only' : 'Any supported file format'}
                                        </p>
                                    </div>

                                    <Button type="submit" className="w-full mt-6" disabled={uploading}>
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading & Selecting...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload & Select
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Card>
                         </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
