'use client';

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ShopGrid } from '@/components/shop-grid';
import type { Book } from '@/lib/types';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function CombosPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'books'));
                const booksData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Book[];
                setBooks(booksData);
            } catch (error) {
                console.error("Error fetching books:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50/50">
                <Header />
                <div className="flex-1 flex justify-center items-center pt-24">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />

            <main className="flex-1 pt-24">
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-purple-50 border-b border-purple-100 py-12"
                >
                    <div className="max-w-7xl mx-auto px-4">
                        <h1 className="text-4xl font-bold mb-3 text-purple-900">Value Combos</h1>
                        <p className="text-purple-700 text-lg max-w-2xl">
                            Save big with our curated book bundles tailored for your exam success.
                        </p>
                    </div>
                </motion.section>

                <section className="max-w-7xl mx-auto px-4 py-12">
                    {/* We pass showCombos={true} to specificially show combos */}
                    <ShopGrid books={books} showCombos={true} />
                </section>
            </main>

            <Footer />
        </div>
    );
}
