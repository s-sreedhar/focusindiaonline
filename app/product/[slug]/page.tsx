'use client';

import { useState, useEffect, use } from 'react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ImageGallery } from '@/components/image-gallery';
import { ReviewsSection } from '@/components/reviews-section';
import { RelatedProducts } from '@/components/related-products';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, BookOpen, TrendingUp, ShieldCheck, Loader2 } from 'lucide-react';
import { Star } from 'lucide-react';
import type { Book } from '@/lib/types';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import Head from 'next/head';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();

  // We need to wait for product to be loaded to check wishlist status
  const [isInWish, setIsInWish] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'books'), where('slug', '==', slug));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        const data = docData.data();
        const bookData = {
          id: docData.id,
          ...data,
          stockQuantity: data.stockQuantity ?? data.stock ?? 0
        } as Book;
        setProduct(bookData);
      } else {
        setProduct(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching product:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slug]);

  useEffect(() => {
    if (product) {
      setIsInWish(isInWishlist(product.id));
    }
  }, [product, isInWishlist]);

  const handleAddToCart = () => {
    if (!product) return;

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
    toast.success('Added to cart');
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    // Optimistic update
    if (isInWish) {
      removeFromWishlist(product.id);
      setIsInWish(false);
      toast.success('Removed from wishlist');
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
      toast.success('Added to wishlist');
    }

    // Sync with Firestore
    try {
      const userRef = doc(db, 'users', user.id);
      if (isInWish) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(product.id)
        });
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(product.id)
        });
      }
    } catch (error) {
      console.error('Error syncing wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <Button asChild>
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Product structured data for SEO
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: `https://focusindiaonline.com${product.image}`,
    description: product.description,
    sku: product.id,
    isbn: product.isbn,
    brand: {
      '@type': 'Brand',
      name: product.publisher || 'Unknown',
    },
    author: {
      '@type': 'Person',
      name: product.author,
    },
    offers: {
      '@type': 'Offer',
      url: `https://focusindiaonline.com/product/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    } : undefined,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{product.title} - Focus India Online</title>
        <meta name="description" content={`${product.description} - By ${product.author}. Price: ₹${product.price}. ${product.inStock ? 'In Stock' : 'Out of Stock'}.`} />
        <meta property="og:title" content={`${product.title} - Focus India Online`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={`https://focusindiaonline.com${product.image}`} />
        <meta property="og:url" content={`https://focusindiaonline.com/product/${product.slug}`} />
        <meta property="og:type" content="product" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      </Head>
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
              <div className="text-sm text-muted-foreground flex gap-2 flex-wrap">
                <Link href="/" className="hover:text-primary">Home</Link>
                <span>/</span>
                <Link href="/shop" className="hover:text-primary">Shop</Link>
                <span>/</span>
                {product.primaryCategory && (
                  <>
                    <Link href={`/shop?category=${product.primaryCategory}`} className="hover:text-primary">
                      {product.primaryCategory}
                    </Link>
                    <span>/</span>
                  </>
                )}
                <span className="truncate max-w-[200px]">{product.title}</span>
              </div>

              {/* Title and Meta */}
              <div>
                <h1 className="text-4xl font-bold mb-2">{product.title}</h1>
                <p className="text-muted-foreground mb-2">By {product.author}</p>
                {product.publisher && <p className="text-sm text-muted-foreground">Publisher: {product.publisher}</p>}
              </div>

              {/* Rating */}
              {(product.rating || 0) > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating || 0)
                            ? 'fill-accent text-accent'
                            : 'text-muted'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{product.rating || 0}</span>
                  </div>
                  <a href="#reviews" className="text-primary hover:underline">
                    {product.reviewCount || 0} Reviews
                  </a>
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">₹{product.price}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-xl line-through text-muted-foreground">
                        ₹{product.originalPrice}
                      </span>
                      <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
              </div>

              {/* Stock Status */}
              <div>
                {product.stockQuantity > 0 ? (
                  <p className="text-green-600 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full" />
                    In Stock
                    {/* ({product.stockQuantity} available) */}
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
                {product.language && <p><span className="font-semibold">Language:</span> {product.language}</p>}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <div className="fixed bottom-[64px] left-0 right-0 bg-white p-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:static sm:bg-transparent sm:p-0 sm:border-0 sm:shadow-none z-40 flex gap-3">
                  <Button
                    className="flex-1 gap-2 rounded-xl h-12 text-base shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={product.stockQuantity <= 0}
                    onClick={handleAddToCart}
                    variant={cartAdded ? "secondary" : "default"}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartAdded ? 'Added!' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-14 h-12 rounded-xl"
                    onClick={handleToggleWishlist}
                  >
                    <Heart className={`w-5 h-5 ${isInWish ? 'fill-accent text-accent' : ''}`} />
                  </Button>
                </div>
                {/* Spacer for fixed bottom bar on mobile */}
                <div className="h-20 sm:hidden"></div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">All Competitive Exam Books</p>
                  <p className="text-xs text-muted-foreground">Only Original Books</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Best in the market</p>
                  <p className="text-xs text-muted-foreground">Best Price</p>
                </div>
                <div className="text-center">
                  <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Years of Experience</p>
                  <p className="text-xs text-muted-foreground">Most Trusted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="border-t pt-12 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">About this Book</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>


          {/* Related Products - Moved above Reviews as requested */}
          <div className="border-t pt-12 mt-12">
            <RelatedProducts
              currentBookId={product.id}
              category={product.category || product.primaryCategory}
            />
          </div>

          {/* Reviews Section */}
          <div className="border-t pt-12 mt-12" id="reviews">
            <ReviewsSection
              bookId={product.id}
              averageRating={product.rating || 0}
              totalReviews={product.reviewCount || 0}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
