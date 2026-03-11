'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Image as ImageIcon, FileText, Check } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
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

    const filteredMedia = mediaItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.url.toLowerCase().includes(searchQuery.toLowerCase());

        // If the selector was opened for a specific type (e.g. 'image'), force that type.
        // Otherwise, allow the local `filterType` state to control it.
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
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Media Library</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col sm:flex-row gap-4 w-full mb-4">
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
                                <TabsTrigger value="document">Documents</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredMedia.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-muted-foreground flex-col gap-2">
                            <ImageIcon className="w-12 h-12 opacity-50" />
                            <p>No media found. Go to the Media Library to upload new files.</p>
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
            </DialogContent>
        </Dialog>
    );
}
