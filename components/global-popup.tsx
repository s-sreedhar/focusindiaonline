'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';

interface PopupSettings {
    imageUrl: string;
    linkUrl?: string;
    title?: string;
    isActive: boolean;
    activeTill?: any;
    autoCloseDelay?: number;
}

export function GlobalPopup() {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<PopupSettings | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

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
                        setTimeLeft(data.autoCloseDelay);
                    }
                }
            } catch (error) {
                console.error('Error fetching popup settings:', error);
            }
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        if (!isOpen || timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    setIsOpen(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, timeLeft]);

    if (!isOpen && !settings) return null;

    // Don't show popup for admins
    if (user?.role === 'superadmin' || user?.role === 'admin') return null;

    return (
        <AnimatePresence>
            {isOpen && settings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
                    >
                        {/* Header/Close Bar */}
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                            {timeLeft !== null && timeLeft > 0 && (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white text-xs font-bold backdrop-blur-md">
                                    {timeLeft}s
                                </div>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
                            >
                                <X className="w-4 h-4" />
                                <span className="sr-only">Close popup</span>
                            </button>
                        </div>

                        {settings.title && (
                            <div className="p-4 bg-primary text-primary-foreground text-center font-bold text-lg">
                                {settings.title}
                            </div>
                        )}

                        {settings.linkUrl ? (
                            <a href={settings.linkUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-[4/3] w-full group overflow-hidden">
                                <Image
                                    src={settings.imageUrl}
                                    alt={settings.title || "Special Offer"}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </a>
                        ) : (
                            <div className="relative aspect-[4/3] w-full">
                                <Image
                                    src={settings.imageUrl}
                                    alt={settings.title || "Special Offer"}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
