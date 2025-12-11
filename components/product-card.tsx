'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Star, ArrowRightLeft } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useAuthStore } from '@/lib/auth-store';
import { useCompareStore } from '@/lib/compare-store';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  id: string;
  title: string;
  author: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  discount?: number;
  slug: string;
  category?: string;
  language?: string;
  subject?: string;
  isCombo?: boolean;
}

export function ProductCard({
  id,
  title,
  author,
  image,
  price,
  originalPrice,
  rating = 4.5,
  discount,
  slug,
  category,
  language,
  subject,
  isCombo
}: ProductCardProps) {
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addToCompare, isInCompare, removeFromCompare } = useCompareStore();
  const [isInWish, setIsInWish] = useState(isInWishlist(id));

  const isCompared = isInCompare(id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      bookId: id,
      title,
      author,
      price,
      originalPrice,
      image,
      quantity: 1,
      slug,
    });
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCompared) {
      removeFromCompare(id);
    } else {
      addToCompare({
        id,
        title,
        author,
        image,
        price,
        originalPrice,
        rating,
        slug,
        category: category || '',
        subjects: subject ? [subject] : [],
        language: language || '',
        inStock: true, // Assuming true for now as card doesn't convey this fully except via disable
        stockQuantity: 10,
        primaryCategory: category || '',
        subCategories: [],
        description: '',
        publisher: ''
      });
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Optimistic update
    if (isInWish) {
      removeFromWishlist(id);
      setIsInWish(false);
    } else {
      addToWishlist({
        bookId: id,
        title,
        author,
        price,
        image,
        slug,
        addedAt: new Date(),
      });
      setIsInWish(true);
    }

    // Sync with Firestore if user is logged in
    const { user } = useAuthStore.getState();
    if (user) {
      try {
        const { db } = await import('@/lib/firebase');
        const { doc, updateDoc, arrayUnion, arrayRemove } = await import('firebase/firestore');
        const userId = user.id || (user as any).uid;
        const userRef = doc(db, 'users', userId);

        if (isInWish) {
          // Removing
          await updateDoc(userRef, {
            wishlist: arrayRemove(id)
          });
        } else {
          // Adding
          await updateDoc(userRef, {
            wishlist: arrayUnion(id)
          });
        }
      } catch (error) {
        console.error('Error syncing wishlist:', error);
        // Revert on error? For now, we'll just log it.
        // Ideally, we should show a toast.
        const { handleFirebaseError } = await import('@/lib/error-utils');
        handleFirebaseError(error);
      }
    }
  };

  return (
    <Link href={`/product/${slug}`}>
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="overflow-hidden h-full flex flex-col group border-transparent shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
          {/* Image Container */}
          <div className="relative bg-gray-50 overflow-hidden aspect-[3/4] flex items-center justify-center p-3">
            <Image
              src={image || "/placeholder.svg"}
              alt={title}
              fill
              className="object-contain group-hover:scale-110 transition-transform duration-500"
            />
            {discount && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                {discount}% OFF
              </div>
            )}

            {/* Quick Actions Overlay */}
            <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 translate-x-0 lg:translate-x-2 lg:group-hover:translate-x-0">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full w-8 h-8 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white hover:text-red-500"
                onClick={handleToggleWishlist}
                title="Add to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isInWish ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className={`rounded-full w-8 h-8 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white hover:text-blue-500 ${isCompared ? 'text-blue-500 bg-blue-50' : ''}`}
                onClick={handleToggleCompare}
                title="Compare"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-2 sm:p-3 flex-1 flex flex-col">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-muted-foreground">{rating}</span>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {language && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 hidden sm:inline-block">
                    {language.split(' ')[0]}
                  </span>
                )}
                {subject && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200 truncate max-w-[80px]">
                    {subject}
                  </span>
                )}
              </div>
            </div>

            <h3 className="font-bold text-sm leading-tight line-clamp-2 text-foreground mb-1 group-hover:text-primary transition-colors min-h-[2.5em]">{title}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-1">{author}</p>

            {/* Price & Add Button */}
            <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="font-bold text-base sm:text-lg text-foreground">₹{price}</span>
                  {originalPrice && (
                    <span className="text-[10px] sm:text-xs line-through text-muted-foreground">
                      ₹{originalPrice}
                    </span>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                className="w-full sm:w-auto h-8 px-3 rounded-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 text-xs sm:text-sm"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
