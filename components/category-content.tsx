'use client';

import { useEffect, useState } from 'react';
import { ShopGrid } from '@/components/shop-grid';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { Book } from '@/lib/types';

interface CategoryContentProps {
    categoryName: string;
}

export function CategoryContent({ categoryName }: CategoryContentProps) {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const q = query(
                    collection(db, 'books'),
                    where('category', '==', categoryName)
                );
                const querySnapshot = await getDocs(q);
                const booksData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Book[];
                setBooks(booksData);
            } catch (error) {
                //console.error("Error fetching books:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, [categoryName]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
                {/* Hero Section */}
                <section className="bg-secondary py-8 border-b">
                    <div className="max-w-7xl mx-auto px-4">
                        <h1 className="text-3xl font-bold mb-2 pb-2 leading-tight">{categoryName} Books</h1>
                        <p className="text-muted-foreground">Browse all books for {categoryName} preparation</p>
                    </div>
                </section>

                {/* Shop Grid */}
                <section className="max-w-7xl mx-auto px-4 py-12">
                    <ShopGrid books={books} activeCategory={categoryName} />
                </section>
            </main>
        </div>
    );
}
