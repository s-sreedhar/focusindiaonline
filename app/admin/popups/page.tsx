'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Image as ImageIcon, Upload } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { DateTimePicker } from '@/components/datetime-picker';
import { Timestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface PopupSettings {
    imageUrl: string;
    linkUrl?: string;
    title?: string;
    isActive: boolean;
    activeTill?: Date | null;
    autoCloseDelay?: number;
    updatedAt?: any;
}

export default function PopupSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [settings, setSettings] = useState<PopupSettings>({
        imageUrl: '',
        linkUrl: '',
        title: '',
        isActive: false,
        activeTill: null,
        autoCloseDelay: 5,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'popup');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setSettings({
                        ...data,
                        activeTill: data.activeTill ? data.activeTill.toDate() : null,
                    } as PopupSettings);
                }
            } catch (error) {
                console.error('Error fetching popup settings:', error);
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!settings.imageUrl) {
            toast.error('Please enter an Image URL');
            return;
        }

        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'popup'), {
                ...settings,
                activeTill: settings.activeTill ? Timestamp.fromDate(settings.activeTill) : null,
                updatedAt: serverTimestamp(),
            });
            toast.success('Popup settings saved successfully');
        } catch (error) {
            console.error('Error saving popup settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(true);
        try {
            const uploadedUrl = await uploadToCloudinary(file, 'popups');
            setSettings({ ...settings, imageUrl: uploadedUrl });
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setImageUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Popup Management</h1>
                <p className="text-muted-foreground">
                    Manage the global promotional popup that appears for visitors.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Popup Configuration</CardTitle>
                        <CardDescription>
                            Configure the appearance and behavior of the popup.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base">Active Status</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable or disable the popup on the website.
                                </p>
                            </div>
                            <Switch
                                checked={settings.isActive}
                                onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title (Optional)</Label>
                            <Input
                                id="title"
                                placeholder="Special Offer!"
                                value={settings.title || ''}
                                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="imageUrl"
                                    placeholder="https://example.com/image.jpg"
                                    value={settings.imageUrl}
                                    onChange={(e) => setSettings({ ...settings, imageUrl: e.target.value })}
                                />
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={imageUploading}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        disabled={imageUploading}
                                    >
                                        {imageUploading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Enter URL manually or upload an image.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkUrl">Link URL (Optional)</Label>
                            <Input
                                id="linkUrl"
                                placeholder="https://focusindia.com/shop/offer"
                                value={settings.linkUrl || ''}
                                onChange={(e) => setSettings({ ...settings, linkUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Active Till (Optional)</Label>
                            <DateTimePicker
                                date={settings.activeTill || undefined}
                                setDate={(date) => setSettings({ ...settings, activeTill: date || null })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Popup will automatically stop showing after this date.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="autoClose">Auto Close Delay (seconds)</Label>
                            <Input
                                id="autoClose"
                                type="number"
                                min="0"
                                placeholder="5"
                                value={settings.autoCloseDelay || ''}
                                onChange={(e) => setSettings({ ...settings, autoCloseDelay: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Set to 0 to disable auto-closing.
                            </p>
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="w-full">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>
                            How the popup will look to your users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center min-h-[300px] bg-gray-50/50 p-4">
                        {settings.imageUrl ? (
                            <div className="relative w-full max-w-sm bg-white rounded-lg overflow-hidden shadow-2xl">
                                {settings.title && (
                                    <div className="p-4 border-b">
                                        <h3 className="font-bold text-lg text-center">{settings.title}</h3>
                                    </div>
                                )}
                                <div className="relative aspect-[4/3] w-full">
                                    <Image
                                        src={settings.imageUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    {!settings.isActive && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold backdrop-blur-[1px]">
                                            INACTIVE
                                        </div>
                                    )}
                                </div>
                                {settings.activeTill && (
                                    <div className="p-2 bg-yellow-50 text-yellow-700 text-xs text-center border-t border-yellow-100">
                                        Expires: {settings.activeTill.toLocaleString()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Enter an image URL to see preview</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
