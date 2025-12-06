'use client';

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ShopGrid } from '@/components/shop-grid';
import type { Book } from '@/lib/types';
import { motion } from 'framer-motion';

// Note: Metadata must be exported from a Server Component
// Since this is a client component, metadata is handled in layout or parent

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ShopPage() {
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
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border-b py-12"
        >
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-3 text-foreground">Explore Our Collection</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Discover the best study materials for your competitive exams. Filter by category, price, and more.
            </p>
          </div>
        </motion.section>

        {/* Shop Grid */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <ShopGrid books={books} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
