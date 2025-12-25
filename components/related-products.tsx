'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product-card';
import type { Book } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface RelatedProductsProps {
  currentBookId: string;
  category: string;
}

export function RelatedProducts({ currentBookId, category }: RelatedProductsProps) {
  const [products, setProducts] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!category) {
        setLoading(false);
        return;
      }

      try {
        // Fetch books in the same category, limit to 5 (to ensure we have 4 after filtering current)
        const q = query(
          collection(db, 'books'),
          where('category', '==', category),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Book))
          .filter(book => book.id !== currentBookId)
          .slice(0, 4); // Take top 4

        setProducts(booksData);
      } catch (error) {
        //console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [category, currentBookId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Related Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
}
