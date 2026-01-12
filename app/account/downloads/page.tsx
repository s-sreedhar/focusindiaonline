'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, Search, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useAuthStore } from '@/lib/auth-store';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import Link from 'next/link';

interface Purchase {
    id: string; // Purchase record ID
    itemId: string;
    title: string;
    description?: string;
    price: number;
    fileUrl: string;
    purchaseDate: any;
}

export default function DownloadsPage() {
    const { user } = useAuthStore();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            fetchPurchases();
        }
    }, [user]);

    const fetchPurchases = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, `users/${user.id}/purchases`),
                orderBy('purchaseDate', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Purchase[];
            setPurchases(data);
        } catch (error) {
            //console.error("Error fetching downloads:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPurchases = purchases.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 pt-24">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Button variant="ghost" asChild className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/account" className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Account
                        </Link>
                    </Button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">My Test Series</h1>
                            <p className="text-muted-foreground">Access your purchased test series and study materials.</p>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredPurchases.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-gray-50">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No test series available</h3>
                            <p className="text-muted-foreground mb-4">You haven't purchased any downloadable content yet.</p>
                            <Button asChild>
                                <Link href="/shop">Browse Store</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPurchases.map((item) => (
                                <Card key={item.id} className="p-6 flex flex-col hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-primary/10 p-3 rounded-lg text-primary">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                                            {item.purchaseDate?.toDate?.()?.toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg mb-2 line-clamp-2" title={item.title}>{item.title}</h3>

                                    <div className="mt-auto pt-4">
                                        <Button className="w-full" asChild>
                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" download>
                                                <Download className="w-4 h-4 mr-2" />
                                                Download PDF
                                            </a>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
