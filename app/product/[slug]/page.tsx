'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ImageGallery } from '@/components/image-gallery';
import { ReviewsSection } from '@/components/reviews-section';
import { RelatedProducts } from '@/components/related-products';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Truck, RotateCcw, Shield } from 'lucide-react';
import { Star } from 'lucide-react';
import type { Book } from '@/lib/types';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import Link from 'next/link';

// Mock product data - replace with real data fetching
const mockProduct: Book = {
  id: '1',
  title: '1000+ Practice Bits Biology',
  slug: 'biology-bits',
  author: 'Dr. Sridhar Goka',
  publisher: 'Aditya Media',
  description: 'Comprehensive collection of practice questions for competitive exams',
  price: 140,
  originalPrice: 199,
  mrp: 199,
  inStock: true,
  stockQuantity: 45,
  image: '/biology-book.jpg',
  images: ['/biology-book.jpg'],
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
};

const mockReviews = [
  {
    id: '1',
    author: 'Rajesh Kumar',
    rating: 5,
    title: 'Excellent book for preparation',
    content: 'This book has everything I needed for my exam preparation. Highly recommended!',
    verified: true,
    helpful: 23,
    date: '2 weeks ago'
  },
  {
    id: '2',
    author: 'Priya Singh',
    rating: 4,
    title: 'Good quality and content',
    content: 'Good book with detailed explanations. Delivery was fast.',
    verified: true,
    helpful: 15,
    date: '1 month ago'
  }
];

const mockRelatedProducts: Book[] = [
  {
    id: '2',
    title: 'Chemistry Practice Bits',
    slug: 'chemistry-bits',
    author: 'Dr. Sharma',
    publisher: 'Aditya Media',
    description: 'Chemistry practice questions',
    price: 160,
    originalPrice: 220,
    mrp: 220,
    inStock: true,
    stockQuantity: 30,
    image: '/placeholder.svg',
    primaryCategory: 'APPSC',
    subCategories: ['Group 1 (AP)'],
    subjects: ['Chemistry', 'Science and Technology'],
    language: 'English Medium',
    rating: 4.3,
    reviewCount: 156,
    discount: 27,
  },
  {
    id: '3',
    title: 'Physics Questions & Answers',
    slug: 'physics-qa',
    author: 'Prof. Gupta',
    publisher: 'Science Publications',
    description: 'Physics Q&A for competitive exams',
    price: 145,
    originalPrice: 189,
    mrp: 189,
    inStock: true,
    stockQuantity: 52,
    image: '/placeholder.svg',
    primaryCategory: 'APPSC',
    subCategories: ['Group 2 (AP)'],
    subjects: ['Physics', 'Science and Technology'],
    language: 'English Medium',
    rating: 4.4,
    reviewCount: 201,
    discount: 23,
  },
  {
    id: '4',
    title: 'General Science Complete Guide',
    slug: 'gen-science-guide',
    author: 'Dr. Patel',
    publisher: 'Knowledge Books',
    description: 'Complete general science guide',
    price: 225,
    originalPrice: 299,
    mrp: 299,
    inStock: true,
    stockQuantity: 38,
    image: '/placeholder.svg',
    primaryCategory: 'APPSC',
    subCategories: ['Group 1 (AP)'],
    subjects: ['General Science', 'Science and Technology'],
    language: 'English Medium',
    rating: 4.6,
    reviewCount: 289,
    discount: 25,
  },
];

export default function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = mockProduct;
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const [isInWish, setIsInWish] = useState(isInWishlist(product.id));
  const [cartAdded, setCartAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      bookId: product.id,
      title: product.title,
      author: product.author,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      quantity: 1,
      slug: product.slug,
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
    console.log("[v0] Added to cart:", product.title);
  };

  const handleToggleWishlist = () => {
    if (isInWish) {
      removeFromWishlist(product.id);
      setIsInWish(false);
      console.log("[v0] Removed from wishlist:", product.title);
    } else {
      addToWishlist({
        bookId: product.id,
        title: product.title,
        author: product.author,
        price: product.price,
        image: product.image,
        slug: product.slug,
        addedAt: new Date(),
      });
      setIsInWish(true);
      console.log("[v0] Added to wishlist:", product.title);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Product Section */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Image Gallery */}
            <ImageGallery images={product.images || [product.image]} title={product.title} />

            {/* Product Info */}
            <div className="space-y-6">
              {/* Breadcrumb */}
              <div className="text-sm text-muted-foreground flex gap-2">
                <Link href="/" className="hover:text-primary">Home</Link>
                <span>/</span>
                <Link href="/shop" className="hover:text-primary">Shop</Link>
                <span>/</span>
                <Link href={`/shop/${product.primaryCategory}`} className="hover:text-primary">
                  {product.primaryCategory}
                </Link>
                <span>/</span>
                <span>{product.title}</span>
              </div>

              {/* Title and Meta */}
              <div>
                <h1 className="text-4xl font-bold mb-2">{product.title}</h1>
                <p className="text-muted-foreground mb-2">By {product.author}</p>
                <p className="text-sm text-muted-foreground">Publisher: {product.publisher}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating || 0)
                            ? 'fill-accent text-accent'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{product.rating}</span>
                </div>
                <a href="#reviews" className="text-primary hover:underline">
                  {product.reviewCount} Reviews
                </a>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">₹{product.price}</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl line-through text-muted-foreground">
                        ₹{product.originalPrice}
                      </span>
                      {product.discount && (
                        <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">
                          -{product.discount}%
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
              </div>

              {/* Stock Status */}
              <div>
                {product.inStock ? (
                  <p className="text-green-600 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full" />
                    In Stock ({product.stockQuantity} available)
                  </p>
                ) : (
                  <p className="text-red-600 font-semibold">Out of Stock</p>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-2 border-t pt-6">
                {product.pageCount && <p><span className="font-semibold">Pages:</span> {product.pageCount}</p>}
                {product.edition && <p><span className="font-semibold">Edition:</span> {product.edition}</p>}
                {product.isbn && <p><span className="font-semibold">ISBN:</span> {product.isbn}</p>}
                <p><span className="font-semibold">Language:</span> {product.language}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6">
                <Button 
                  className="flex-1 gap-2" 
                  size="lg" 
                  disabled={!product.inStock}
                  onClick={handleAddToCart}
                  variant={cartAdded ? "secondary" : "default"}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartAdded ? 'Added to Cart!' : 'Add to Cart'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-14"
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`w-5 h-5 ${isInWish ? 'fill-accent text-accent' : ''}`} />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Free Delivery</p>
                  <p className="text-xs text-muted-foreground">On orders above ₹500</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">7 days policy</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Authentic</p>
                  <p className="text-xs text-muted-foreground">100% original</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="border-t pt-12 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">About this Book</h2>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="text-xl font-bold mb-4">Key Features</h3>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>Comprehensive coverage of all topics</li>
                <li>1000+ practice questions with solutions</li>
                <li>Latest exam patterns and trends</li>
                <li>Easy-to-understand explanations</li>
                <li>Mock tests and answer keys included</li>
              </ul>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="border-t pt-12 mt-12" id="reviews">
            <ReviewsSection
              reviews={mockReviews}
              averageRating={product.rating || 4.5}
              totalReviews={product.reviewCount || 0}
            />
          </div>

          {/* Related Products */}
          <div className="border-t pt-12 mt-12">
            <RelatedProducts products={mockRelatedProducts} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
