import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ShopGrid } from '@/components/shop-grid';
import { PRIMARY_CATEGORIES } from '@/lib/constants';
import type { Book } from '@/lib/types';

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
];

export async function generateStaticParams() {
  return PRIMARY_CATEGORIES.map((category) => ({
    category: category,
  }));
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const categoryName = params.category;
  const categoryBooks = mockBooks.filter(
    (book) => book.primaryCategory === categoryName
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="bg-secondary py-8 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2 pb-2 leading-tight">{categoryName} Books</h1>
            <p className="text-muted-foreground">Browse all books for {categoryName} preparation</p>
          </div>
        </section>

        {/* Shop Grid */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <ShopGrid books={categoryBooks.length > 0 ? categoryBooks : mockBooks} activeCategory={categoryName} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
