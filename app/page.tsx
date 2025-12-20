'use client';

import { Header } from '@/components/layouts/header';
import { HeroCarousel } from '@/components/hero-carousel';
import { Footer } from '@/components/layouts/footer';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, ArrowRight, BookOpen, TrendingUp, Award, Truck, Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Carousel } from '@/components/carousel';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { TestimonialsSection } from '@/components/testimonials-section';

interface Book {
  id: string;
  title: string;
  author: string;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  slug: string;
  createdAt: any;
  category: string;
  language?: string;
  subject?: string;
  isCombo?: boolean;
}

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  link: string;
  order?: number;
}



export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest books
        const booksQuery = query(collection(db, 'books'), orderBy('createdAt', 'desc'), limit(50));
        const booksSnapshot = await getDocs(booksQuery);
        const booksData = booksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[];
        setBooks(booksData);

        // Fetch banners
        // We fetch by createdAt first to ensure we get them, then sort by order in memory
        // This prevents issues where old banners without 'order' field disappear
        const bannersQuery = query(collection(db, 'banners'));
        const bannersSnapshot = await getDocs(bannersQuery);
        const bannersData = bannersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Banner[];

        // Sort by order (if exists) or fallback to createdAt
        bannersData.sort((a, b) => {
          const orderA = a.order ?? 999;
          const orderB = b.order ?? 999;
          return orderA - orderB;
        });

        setBanners(bannersData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Algorithms for different sections
  const newArrivals = books.slice(0, 12);

  // Best Sellers: Sort by rating (desc)
  const bestSellers = [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);

  // Trending: Sort by discount percentage (desc) or price
  // Let's use discount percentage as a proxy for "Trending" (Hot Deals)
  const trendingBooks = [...books].sort((a, b) => {
    const discountA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
    const discountB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
    return discountB - discountA;
  }).slice(0, 12);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        {banners.length > 0 ? (
          <section className="pt-20 lg:pt-28">
            <HeroCarousel banners={banners} />
          </section>
        ) : (
          <section className="relative overflow-hidden bg-white pt-20 pb-12 lg:pt-28 lg:pb-20">
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <div className="container mx-auto px-4 max-w-[1600px] relative">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="lg:w-1/2 space-y-6 text-center lg:text-left"
                >
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    #1 Trusted Book Store
                  </div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
                    Master Your <br />
                    <span className="text-primary">Competitive Exams</span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                    Get the best study materials for UPSC, SSC, Banking, and more.
                    Curated by experts to help you succeed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button asChild size="lg" className="rounded-full px-8 text-lg h-12 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all w-full sm:w-auto">
                      <Link href="/shop">Start Learning Now</Link>
                    </Button>
                  </div>

                  {/* Search Bar */}
                  <div className="max-w-md mx-auto lg:mx-0 pt-4 w-full px-4 sm:px-0">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search books..."
                        className="w-full h-12 pl-4 pr-12 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && typeof window !== 'undefined') {
                            router.push(`/shop?search=${encodeURIComponent(e.currentTarget.value)}`);
                          }
                        }}
                      />
                      <div className="absolute right-1 top-1 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                        onClick={(e) => {
                          // Find the input sibling and get value
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input && input.value) {
                            router.push(`/shop?search=${encodeURIComponent(input.value)}`);
                          }
                        }}
                      >
                        <Search className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-full text-green-600"><Truck className="w-3 h-3 md:w-4 md:h-4" /></div>
                      <span>Fast Delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Award className="w-3 h-3 md:w-4 md:h-4" /></div>
                      <span>Genuine Books</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-full text-orange-600"><BookOpen className="w-3 h-3 md:w-4 md:h-4" /></div>
                      <span>Huge Collection</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:w-1/2 relative mt-8 lg:mt-0"
                >
                  <div className="relative z-10 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2rem] p-4 md:p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                      <div className="aspect-[4/3] relative bg-gray-50 flex items-center justify-center">
                        {/* Placeholder for Hero Image */}
                        <div className="text-center p-8">
                          <BookOpen className="w-16 h-16 md:w-24 md:h-24 text-primary/20 mx-auto mb-4" />
                          <p className="text-muted-foreground font-medium">Premium Study Materials</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-50" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50" />
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Trending Books Carousel */}
            {trendingBooks.length > 0 && (
              <section className="py-12 bg-white">
                <div className="container mx-auto px-4 max-w-[1600px]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">Trending Books</h2>
                      <p className="text-muted-foreground text-sm md:text-base">Top deals and hot picks</p>
                    </div>
                  </div>

                  <Carousel>
                    {Array.from({ length: Math.ceil(trendingBooks.length / 4) }).map((_, slideIndex) => (
                      <div key={slideIndex} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-1 md:px-4">
                        {trendingBooks.slice(slideIndex * 4, (slideIndex + 1) * 4).map((book) => (
                          <ProductCard
                            key={`${slideIndex}-${book.id}`}
                            {...book}
                            discount={book.originalPrice ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0}
                          />
                        ))}
                      </div>
                    ))}
                  </Carousel>
                </div>
              </section>
            )}

            {/* New Arrivals */}
            <section className="py-12 bg-gray-50/50">
              <div className="container mx-auto px-4 max-w-[1600px]">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">New Arrivals</h2>
                    <p className="text-muted-foreground text-sm md:text-base">Freshly added study materials</p>
                  </div>
                  <Button variant="outline" asChild className="rounded-full text-xs md:text-sm h-8 md:h-10">
                    <Link href="/shop?sort=newest">View All</Link>
                  </Button>
                </div>

                {newArrivals.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {newArrivals.map((book, i) => (
                      <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <ProductCard
                          {...book}
                          discount={book.originalPrice ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No books available at the moment.
                  </div>
                )}
              </div>
            </section>

            {/* Combos / Bundles Section */}
            {books.filter(b => (b as any).isCombo || b.category === 'Value Bundles').length > 0 && (
              <section className="py-16 bg-white">
                <div className="container mx-auto px-4 max-w-[1600px]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-6 h-6 text-purple-600" />
                        <h2 className="text-3xl font-bold">Value Combos</h2>
                      </div>
                      <p className="text-muted-foreground">Save more with our curated book bundles</p>
                    </div>
                    <Button variant="outline" asChild className="rounded-full">
                      <Link href="/shop?bundles=true">View All Combos</Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.filter(b => (b as any).isCombo || b.category === 'Value Bundles').slice(0, 3).map((combo, i) => (
                      <motion.div
                        key={combo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative bg-white border border-purple-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col md:flex-row h-full">
                          <div className="relative w-full md:w-2/5 aspect-[4/3] md:aspect-auto">
                            <Image
                              src={combo.image || '/placeholder-book.jpg'}
                              alt={combo.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-6 flex flex-col justify-between flex-1">
                            <div>
                              <div className="inline-block px-3 py-1 mb-3 text-xs font-bold text-purple-700 bg-purple-100 rounded-full">
                                Bundle Deal
                              </div>
                              <h3 className="text-xl font-bold mb-2 group-hover:text-purple-700 transition-colors">
                                {combo.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {/* @ts-ignore */}
                                {combo.description || 'Complete your preparation with this bundle.'}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex flex-col">
                                <span className="text-2xl font-bold text-primary">₹{combo.price}</span>
                                {/* @ts-ignore */}
                                {combo.originalPrice > combo.price && (
                                  <span className="text-sm text-muted-foreground line-through">₹{combo.originalPrice}</span>
                                )}
                              </div>
                              <Button asChild className="rounded-full">
                                <Link href={`/product/${combo.slug}`}>View Combo</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Best Sellers */}
            {bestSellers.length > 0 && (
              <section className="py-12 bg-white">
                <div className="container mx-auto px-4 max-w-[1600px]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Best Sellers</h2>
                      <p className="text-muted-foreground">Most popular among students</p>
                    </div>
                    <Button variant="outline" asChild className="rounded-full">
                      <Link href="/shop?sort=bestselling">View All</Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {bestSellers.map((book, i) => (
                      <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <ProductCard
                          {...book}
                          discount={book.originalPrice ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Why Choose Us */}
        <section className="py-16 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="container mx-auto px-4 max-w-[1600px] relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Focus India Online?</h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto">
                We are dedicated to providing the best resources for your exam preparation journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { title: 'Authentic Books', desc: '100% authentic and original books directly from publishers', icon: BookOpen },
                { title: 'Fast Delivery', desc: 'Quick and safe delivery across India within 3-5 days', icon: Truck },
                { title: 'Best Prices', desc: 'Competitive prices with regular discounts and offers', icon: TrendingUp },
                { title: 'Expert Support', desc: '24/7 customer support team to guide you', icon: Award }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-colors"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-primary-foreground/70">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Newsletter */}
        {/* <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-primary/5 rounded-3xl p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="mb-8 text-muted-foreground max-w-lg mx-auto">
                Subscribe to our newsletter to get the latest updates on new book releases, exam notifications, and exclusive offers.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-6 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                />
                <Button size="lg" className="rounded-full px-8">Subscribe</Button>
              </form>
            </div>
          </div>
        </section> */}
      </main>

      <Footer />
    </div>
  );
}
