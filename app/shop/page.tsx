'use client';

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ShopGrid } from '@/components/shop-grid';
import type { Book } from '@/lib/types';
import { motion } from 'framer-motion';

// Note: Metadata must be exported from a Server Component
// Since this is a client component, metadata is handled in layout or parent

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ShopPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [testSeries, setTestSeries] = useState<any[]>([]); // Add test series state
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeBooks: () => void;
    let unsubscribeTestSeries: () => void;
    let unsubscribeSubjects: () => void;
    let unsubscribeCategories: () => void;

    const setupListeners = async () => {
      try {
        // Real-time Books Listener
        const booksQuery = collection(db, 'books');
        unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
          const booksData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              inStock: data.inStock !== undefined ? data.inStock : (data.stockQuantity ? Number(data.stockQuantity) > 0 : false),
            };
          }).filter((item: any) => item.show !== false) as Book[];
          setBooks(booksData);
        }, (error) => {
          console.error("Error watching books:", error);
        });

        // Real-time Test Series Listener
        const tsQuery = collection(db, 'test_series');
        unsubscribeTestSeries = onSnapshot(tsQuery, (snapshot) => {
          const tsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              image: data.imageUrl,
              slug: `ts-${doc.id}`,
              category: 'Test Series',
              isTestSeries: true
            };
          }).filter((item: any) => item.show !== false);
          setTestSeries(tsData);
        }, (error) => {
          console.error("Error watching test series:", error);
        });

        // Real-time Subjects Listener
        const subjectsQuery = query(collection(db, 'subjects'), orderBy('name'));
        unsubscribeSubjects = onSnapshot(subjectsQuery, (snapshot) => {
          const subjectsData = snapshot.docs.map(doc => doc.data().name as string);
          setAllSubjects(subjectsData);
        }, (error) => {
          console.error("Error watching subjects:", error);
        });

        // Real-time Categories Listener
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name'));
        unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
          const categoriesData = snapshot.docs.map(doc => doc.data().name as string);
          setAllCategories(categoriesData);
        }, (error) => {
          console.error("Error watching categories:", error);
        });

      } catch (error) {
        //console.error("Error setting up listeners:", error);
      } finally {
        // Just a safety net, but usually listeners fire immediately with cache or server data
        // We'll trust the UI to update. 
        // We can force loading false after a moment or manage it via listener callbacks if needed.
        // For now, let's assume fast connection or cache.
        // A better pattern is to use a promise wrapper or individual loading states, 
        // but for this refactor, we'll clear loading simply.
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeBooks) unsubscribeBooks();
      if (unsubscribeTestSeries) unsubscribeTestSeries();
      if (unsubscribeSubjects) unsubscribeSubjects();
      if (unsubscribeCategories) unsubscribeCategories();
    };
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

      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border-b py-4 md:py-12"
        >
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-foreground">Explore Our Collection</h1>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl">
              Discover the best study materials for your competitive exams. Filter by category, price, and more.
            </p>
          </div>
        </motion.section>

        {/* Shop Grid */}
        <section className="max-w-7xl mx-auto px-4 py-4 md:py-12">
          {/* We pass all fetched subjects and categories to ShopGrid so filters can show them all */}
          <ShopGrid books={books} testSeries={testSeries} allSubjects={allSubjects} allCategories={allCategories} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
