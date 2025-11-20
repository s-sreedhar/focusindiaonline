'use client';

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ShopGrid } from '@/components/shop-grid';
import type { Book } from '@/lib/types';
import { motion } from 'framer-motion';

// Mock data - replace with real data fetching
const mockBooks: Book[] = [
  {
    id: '1',
    title: '1000+ Practice Bits Biology',
    slug: 'biology-bits',
    author: 'Dr. Sridhar Goka',
    publisher: 'Aditya Media',
    description: 'Comprehensive biology practice questions',
    price: 140,
    originalPrice: 199,
    mrp: 199,
    inStock: true,
    stockQuantity: 45,
    image: '/biology-book.jpg',
    primaryCategory: 'APPSC',
    subCategories: ['Group 1 (AP)', 'Group 2 (AP)'],
    subjects: ['Biology', 'Science and Technology'],
    language: 'English Medium',
    rating: 4.5,
    reviewCount: 234,
    discount: 30,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    pageCount: 320,
    edition: '2nd Edition',
    isbn: '978-1234567890'
  },
  {
    id: '2',
    title: 'Jan Polity & Constitution',
    slug: 'polity-constitution',
    author: '21st Century IAS',
    publisher: '21st Century',
    description: 'Complete polity and constitution guide for competitive exams',
    price: 190,
    originalPrice: 220,
    mrp: 220,
    inStock: true,
    stockQuantity: 32,
    image: '/polity-book.jpg',
    primaryCategory: 'UPSC',
    subCategories: ['Civil Services'],
    subjects: ['Polity', 'General Knowledge'],
    language: 'English Medium',
    rating: 4.8,
    reviewCount: 412,
    discount: 14,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    pageCount: 456,
    edition: '1st Edition',
    isbn: '978-0987654321'
  },
  {
    id: '3',
    title: 'Telangana Movement & Culture',
    slug: 'telangana-movement',
    author: 'AK Publications',
    publisher: 'AK Publications',
    description: 'Detailed coverage of Telangana history and culture',
    price: 120,
    originalPrice: 159,
    mrp: 159,
    inStock: true,
    stockQuantity: 67,
    image: '/telangana-culture.jpg',
    primaryCategory: 'TGPSC',
    subCategories: ['Group 1 (TG)', 'Group 2 (TG)'],
    subjects: ['History', 'Geography'],
    language: 'Telugu Medium',
    rating: 4.3,
    reviewCount: 156,
    discount: 24,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    pageCount: 280,
    edition: '3rd Edition',
    isbn: '978-1112223334'
  },
  {
    id: '4',
    title: 'EMRS Economics',
    slug: 'emrs-economics',
    author: 'ADDA 247 Publications',
    publisher: 'ADDA 247',
    description: 'Economics guide for competitive exams',
    price: 360,
    originalPrice: 545,
    mrp: 545,
    inStock: true,
    stockQuantity: 28,
    image: '/economics-book.jpg',
    primaryCategory: 'SSC',
    subCategories: ['Combined Graduate Level (CGL)'],
    subjects: ['Economy', 'General Knowledge'],
    language: 'English Medium',
    rating: 4.6,
    reviewCount: 289,
    discount: 34,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: true,
    pageCount: 512,
    edition: '2nd Edition',
    isbn: '978-5556667778'
  },
  {
    id: '5',
    title: 'Road to Telangana',
    slug: 'road-telangana',
    author: 'Aditya Media',
    publisher: 'Aditya Media',
    description: 'Journey through Telangana historical events',
    price: 250,
    originalPrice: 279,
    mrp: 279,
    inStock: false,
    stockQuantity: 0,
    image: '/road-telangana.jpg',
    primaryCategory: 'TGPSC',
    subCategories: ['Group 1 (TG)'],
    subjects: ['History'],
    language: 'Telugu Medium',
    rating: 4.7,
    reviewCount: 178,
    discount: 10,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    pageCount: 368,
    edition: '1st Edition',
    isbn: '978-9990001112'
  },
  {
    id: '6',
    title: 'MCQs in Laboratory Technology',
    slug: 'lab-mcqs',
    author: 'AITBS Books',
    publisher: 'AITBS',
    description: 'Multiple choice questions for lab technology',
    price: 555,
    originalPrice: 699,
    mrp: 699,
    inStock: true,
    stockQuantity: 15,
    image: '/lab-technology.jpg',
    primaryCategory: 'BANKING',
    subCategories: ['IBPS Exams'],
    subjects: ['Science and Technology'],
    language: 'English Medium',
    rating: 4.4,
    reviewCount: 124,
    discount: 20,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    pageCount: 224,
    edition: '1st Edition',
    isbn: '978-1231234567'
  },
];

export default function ShopPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1">
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
          <ShopGrid books={mockBooks} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
