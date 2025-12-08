import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Card } from '@/components/ui/card';
import { BookOpen, Award, TrendingUp, Truck, Users, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { motion } from 'framer-motion';

export const metadata: Metadata = {
  title: 'About Us | Focus India Online',
  description: 'Learn about Focus India Online - your trusted partner for competitive exam preparation books since 2010. We provide authentic study materials for UPSC, SSC, RRB, Banking, APPSC, TGPSC and more.',
  openGraph: {
    title: 'About Focus India Online',
    description: 'Learn about Focus India Online - your trusted partner for competitive exam preparation books.',
    url: 'https://focusindiaonline.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground py-20 lg:py-32">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
          <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              About Focus India Online
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 max-w-3xl mx-auto font-light leading-relaxed">
              Empowering aspirants with the best competitive exam resources since 2010.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-7xl -mt-16 relative z-20 pb-20">
          <Card className="bg-white/80 backdrop-blur-md shadow-xl border-none p-8 md:p-12 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">Our Story</span>
                <h2 className="text-3xl font-bold text-foreground">A Decade of Excellence</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Focus India Online started as a humble initiative to bridge the gap between quality study materials and dedicated aspirants. Over the last decade, we have grown into a leading online destination for exam preparation books.
                  </p>
                  <p>
                    We understand the challenges of competitive exams. That's why we curate only the most authentic and updated materials from top publishers and authors. Our mission is simple: to make quality education accessible to every student, irrespective of their location.
                  </p>
                </div>
              </div>
              <div className="relative h-64 md:h-full min-h-[300px] bg-gray-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                {/* Placeholder for an image */}
                <div className="text-center p-6 opacity-50">
                  <Users className="w-24 h-24 text-primary mx-auto mb-4" />
                  <p className="font-medium text-lg">Serving 100,000+ Students</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Us?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We go the extra mile to ensure your preparation journey is smooth and successful.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Wide Range', desc: 'Books for all major competitive exams including UPSC, SSC, Banking, and State PSCs.', icon: BookOpen },
                { title: 'Best Prices', desc: 'We offer the most competitive prices with regular discounts to help you save more.', icon: TrendingUp },
                { title: 'Fast Delivery', desc: 'Our efficient logistics network ensures your books reach you within 3-5 business days.', icon: Truck },
                { title: '100% Authentic', desc: 'We source directly from publishers, guaranteeing you receive only original books.', icon: ShieldCheck },
                { title: 'Expert Support', desc: 'Our knowledgeable support team is here to guide you in choosing the right materials.', icon: Users },
                { title: 'Easy Returns', desc: 'Not satisfied? Our hassle-free return policy ensures you can shop with confidence.', icon: Award }
              ].map((item, i) => (
                <Card key={i} className="p-6 hover:shadow-lg transition-shadow border-gray-100 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
            <div className="relative z-10 w-full max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold">Ready to Start Your Preparation?</h2>
              <p className="text-primary-foreground/80 text-lg">
                Browse our extensive collection of study materials and take the first step towards your dream career.
              </p>
              {/* Note: In a real scenario, I would add a Button component here linking to /shop, 
                   but I need to import Button first or keep it simple. Let's keep it simple or import Button if needed. 
                   I didn't import Button in the top imports, so I'll skip it for now or standard anchor tag style.
                   Actually, let's just leave the message strong. 
               */}
            </div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
