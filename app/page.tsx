'use client';

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, ArrowRight, BookOpen, TrendingUp, Award, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data - replace with real data fetching
const featuredProducts = [
  {
    id: '1',
    title: '1000+ Practice Bits Biology',
    author: 'Dr. Sridhar Goka',
    image: '/biology-book.jpg',
    price: 140,
    originalPrice: 199,
    discount: 30,
    rating: 4.5,
    slug: 'biology-bits'
  },
  {
    id: '2',
    title: 'Jan Polity & Constitution',
    author: '21st Century IAS',
    image: '/polity-book.jpg',
    price: 190,
    originalPrice: 220,
    discount: 14,
    rating: 4.8,
    slug: 'polity-constitution'
  },
  {
    id: '3',
    title: 'Telangana Movement & Culture',
    author: 'AK Publications',
    image: '/telangana-culture.jpg',
    price: 120,
    originalPrice: 159,
    discount: 24,
    rating: 4.3,
    slug: 'telangana-movement'
  },
  {
    id: '4',
    title: 'EMRS Economics',
    author: 'ADDA 247 Publications',
    image: '/economics-book.jpg',
    price: 360,
    originalPrice: 545,
    discount: 34,
    rating: 4.6,
    slug: 'emrs-economics'
  }
];

const bestSellers = [
  {
    id: '5',
    title: 'Road to Telangana',
    author: 'Aditya Media',
    image: '/road-telangana.jpg',
    price: 250,
    originalPrice: 279,
    discount: 10,
    rating: 4.7,
    slug: 'road-telangana'
  },
  {
    id: '6',
    title: 'MCQs in Laboratory Technology',
    author: 'AITBS Books',
    image: '/lab-technology.jpg',
    price: 555,
    originalPrice: 699,
    discount: 20,
    rating: 4.4,
    slug: 'lab-mcqs'
  },
  {
    id: '7',
    title: 'Bank PO Clerk Exam',
    author: 'ADDA 247',
    image: '/bank-po-exam.jpg',
    price: 490,
    originalPrice: 699,
    discount: 30,
    rating: 4.9,
    slug: 'bank-po-clerk'
  },
  {
    id: '8',
    title: 'Reasoning Comprehensively',
    author: 'ADDA 247',
    image: '/reasoning-book.jpg',
    price: 700,
    originalPrice: 899,
    discount: 22,
    rating: 4.5,
    slug: 'reasoning-comprehensive'
  }
];

const testimonials = [
  {
    name: 'Rajesh Kumar',
    text: 'Excellent collection of books. Fast delivery and great customer support!',
    rating: 5
  },
  {
    name: 'Priya Sharma',
    text: 'The books helped me clear my SSC exam. Highly recommended!',
    rating: 5
  },
  {
    name: 'Amit Patel',
    text: 'Best prices and authentic books. Great experience shopping here.',
    rating: 4
  }
];

const categories = [
  { name: 'UPSC', count: 345, color: 'from-blue-500 to-cyan-400' },
  { name: 'SSC', count: 287, color: 'from-purple-500 to-pink-400' },
  { name: 'RRB', count: 192, color: 'from-orange-500 to-amber-400' },
  { name: 'BANKING', count: 156, color: 'from-emerald-500 to-teal-400' }
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white pt-20 pb-12 lg:pt-28 lg:pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
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
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
                  Master Your <br />
                  <span className="text-primary">Competitive Exams</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  Get the best study materials for UPSC, SSC, Banking, and more.
                  Curated by experts to help you succeed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button asChild size="lg" className="rounded-full px-8 text-lg h-12 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                    <Link href="/shop">Start Learning Now</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full px-8 text-lg h-12 border-2 hover:bg-accent/5">
                    <Link href="/shop/UPSC">Explore Categories</Link>
                  </Button>
                </div>

                <div className="pt-6 flex items-center justify-center lg:justify-start gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-full text-green-600"><Truck className="w-4 h-4" /></div>
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Award className="w-4 h-4" /></div>
                    <span>Genuine Books</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-full text-orange-600"><BookOpen className="w-4 h-4" /></div>
                    <span>Huge Collection</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:w-1/2 relative"
              >
                <div className="relative z-10 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2rem] p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    <div className="aspect-[4/3] relative bg-gray-50 flex items-center justify-center">
                      {/* Placeholder for Hero Image */}
                      <div className="text-center p-8">
                        <BookOpen className="w-24 h-24 text-primary/20 mx-auto mb-4" />
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

        {/* Featured Categories */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-[1600px]">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Browse Categories</h2>
                <p className="text-muted-foreground">Find books for your specific exam needs</p>
              </div>
              <Button variant="ghost" className="hidden sm:flex group" asChild>
                <Link href="/shop">
                  View All <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/shop/${cat.name}`}>
                    <Card className={`p-6 h-full bg-gradient-to-br ${cat.color} text-white border-none shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative group`}>
                      <div className="relative z-10">
                        <h3 className="font-bold text-2xl mb-2">{cat.name}</h3>
                        <p className="text-white/90 font-medium">{cat.count}+ Books</p>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-4 translate-y-4">
                        <BookOpen className="w-24 h-24" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-12 bg-gray-50/50">
          <div className="container mx-auto px-4 max-w-[1600px]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">New Arrivals</h2>
                <p className="text-muted-foreground">Freshly added study materials</p>
              </div>
              <Button variant="outline" asChild className="rounded-full">
                <Link href="/shop?sort=newest">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Best Sellers */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
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
        <section className="py-16 bg-gray-50/50">
          <div className="container mx-auto px-4 max-w-[1600px]">
            <h2 className="text-3xl font-bold mb-12 text-center">What Our Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-8 h-full border-none shadow-md hover:shadow-xl transition-all bg-white relative">
                    <div className="absolute top-6 right-8 text-6xl text-primary/10 font-serif">"</div>
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className={`w-4 h-4 ${j < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic relative z-10">{testimonial.text}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                        {testimonial.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">Verified Buyer</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

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
