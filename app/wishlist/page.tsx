'use client';

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/lib/wishlist-store';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WishlistPage() {
  const { items } = useWishlistStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <Header />

        <main className="flex-1 container mx-auto px-4 max-w-[1600px] w-full pt-24 pb-16 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 bg-white p-12 rounded-3xl shadow-sm max-w-md w-full"
          >
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold">Your wishlist is empty</h1>
            <p className="text-muted-foreground">Save your favorite books for later</p>
            <Button asChild size="lg" className="rounded-full px-8 w-full">
              <Link href="/shop">Browse Books</Link>
            </Button>
          </motion.div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 max-w-[1600px] py-12">
          <h1 className="text-3xl font-bold mb-8 pb-2 leading-tight">My Wishlist ({items.length})</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item, i) => (
              <motion.div
                key={item.bookId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard
                  id={item.bookId}
                  title={item.title}
                  author={item.author}
                  image={item.image}
                  price={item.price}
                  slug={item.slug}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
