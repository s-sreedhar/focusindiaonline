'use client';

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ShopGrid } from '@/components/shop-grid';
import type { Book } from '@/lib/types';
import { motion } from 'framer-motion';

// Note: Metadata must be exported from a Server Component
// Since this is a client component, metadata is handled in layout or parent

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ShopPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Books
        const booksSnapshot = await getDocs(collection(db, 'books'));
        const booksData = booksSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure inStock is determined by stockQuantity if explicit inStock boolean is missing
            inStock: data.inStock !== undefined ? data.inStock : (data.stockQuantity ? Number(data.stockQuantity) > 0 : false),
          };
        }) as Book[];
        setBooks(booksData);

        // Fetch Subjects
        const subjectsQuery = query(collection(db, 'subjects'), orderBy('name'));
        const subjectsSnapshot = await getDocs(subjectsQuery);
        const subjectsData = subjectsSnapshot.docs.map(doc => doc.data().name as string);
        setAllSubjects(subjectsData);

        // Fetch Categories
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name'));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => doc.data().name as string);
        setAllCategories(categoriesData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          <ShopGrid books={books} allSubjects={allSubjects} allCategories={allCategories} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
