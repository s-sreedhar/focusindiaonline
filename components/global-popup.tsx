'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

interface PopupSettings {
    imageUrl: string;
    linkUrl?: string;
    title?: string;
    isActive: boolean;
    activeTill?: any;
    autoCloseDelay?: number;
}

export function GlobalPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<PopupSettings | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'popup');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as PopupSettings;

                    // Check if active
                    if (!data.isActive) return;

                    // Check if expired
                    if (data.activeTill) {
                        // Handle both Firestore Timestamp and regular Date objects
                        const expiryDate = data.activeTill.toDate ? data.activeTill.toDate() : new Date(data.activeTill);
                        if (new Date() > expiryDate) return;
                    }

                    setSettings(data);
                    setIsOpen(true);

                    // Handle auto-close
                    if (data.autoCloseDelay && data.autoCloseDelay > 0) {
                        const timer = setTimeout(() => {
                            setIsOpen(false);
                        }, data.autoCloseDelay * 1000);
                        return () => clearTimeout(timer);
                    }
                }
            } catch (error) {
                console.error('Error fetching popup settings:', error);
            }
        };

        fetchSettings();
    }, []);

    if (!isOpen || !settings) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
                >
                    <X className="w-5 h-5" />
                    <span className="sr-only">Close popup</span>
                </button>

                {settings.title && (
                    <div className="p-4 bg-primary text-primary-foreground text-center font-bold text-lg">
                        {settings.title}
                    </div>
                )}

                {settings.linkUrl ? (
                    <a href={settings.linkUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-[4/3] w-full group">
                        <Image
                            src={settings.imageUrl}
                            alt={settings.title || "Special Offer"}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </a>
                ) : (
                    <div className="relative aspect-[4/3] w-full">
                        <Image
                            src={settings.imageUrl}
                            alt={settings.title || "Special Offer"}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {settings.autoCloseDelay && settings.autoCloseDelay > 0 ? (
                    <div className="h-1 bg-gray-100">
                        <div
                            className="h-full bg-primary animate-[progress_linear_forwards] origin-left"
                            style={{ animationDuration: `${settings.autoCloseDelay}s` }}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
