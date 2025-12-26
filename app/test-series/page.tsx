'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, FileText, Lock, Download, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TestSeries {
    id: string;
    title: string;
    description: string;
    price: number;
    fileUrl: string;
    imageUrl?: string;
}

export default function TestSeriesPublicPage() {
    const [series, setSeries] = useState<TestSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchSeries();
        if (user) {
            fetchPurchases();
        }
    }, [user]);

    const fetchSeries = async () => {
        try {
            const q = query(collection(db, 'test_series'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TestSeries[];
            setSeries(data.filter((s: any) => s.show !== false));
        } catch (error) {
            //console.error("Error fetching series:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPurchases = async () => {
        if (!user) return;
        try {
            const q = query(collection(db, `users/${user.id}/purchases`));
            const querySnapshot = await getDocs(q);
            const ids = querySnapshot.docs.map(doc => doc.data().itemId);
            setPurchasedIds(ids);
        } catch (error) {
            //console.error("Error fetching purchases:", error);
        }
    };

    const handleBuy = async (item: TestSeries) => {
        if (!user) {
            toast.error("Please login to purchase");
            router.push('/login');
            return;
        }

        // Mock Payment Flow for now
        // In real app, open Razorpay/PhonePe here.
        // On success:
        if (confirm(`Confirm purchase of ${item.title} for ₹${item.price}?`)) {
            try {
                // Record purchase
                await addDoc(collection(db, `users/${user.id}/purchases`), {
                    itemId: item.id,
                    title: item.title,
                    price: item.price,
                    purchaseDate: serverTimestamp(),
                    type: 'test_series',
                    fileUrl: item.fileUrl // Store URL in purchase record for easy access? Or Look up later.
                });

                toast.success("Purchase successful!");
                setPurchasedIds(prev => [...prev, item.id]);

                // Also create an Order record for admin visibility?
                // For simplicity, we stick to user purchase record for access.
            } catch (error) {
                //console.error("Purchase error:", error);
                toast.error("Purchase failed");
            }
        }
    };

    const filteredSeries = series.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl pt-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Test Series & Study Materials</h1>
                        <p className="text-muted-foreground">Premium downloadable content for your preparation.</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search test series..."
                            className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSeries.map((item) => {
                            const isPurchased = purchasedIds.includes(item.id);
                            return (
                                <Card key={item.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                                    <div className="p-6 flex-1">
                                        <div className="aspect-video bg-muted rounded-lg w-full mb-4 overflow-hidden relative flex items-center justify-center">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <FileText className="w-12 h-12 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                                            {item.description}
                                        </p>
                                        <div className="text-2xl font-bold text-primary">
                                            ₹{item.price}
                                        </div>
                                    </div>
                                    <div className="p-6 pt-0 mt-auto">
                                        {isPurchased ? (
                                            <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" download>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Now
                                                </a>
                                            </Button>
                                        ) : (
                                            <Button className="w-full" asChild>
                                                <Link href={`/product/ts-${item.id}`}>
                                                    {item.price === 0 ? 'Get Free' : 'View Details'}
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                        {filteredSeries.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                No test series found matching your search.
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
