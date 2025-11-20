import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Card } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
        <h1 className="text-4xl font-bold mb-8">About Times Book Stall</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <p className="text-muted-foreground mb-4">
              Times Book Stall is a leading online destination for competitive exam preparation books and study materials. Founded with a mission to make quality educational resources accessible to every aspirant, we've been serving students since 2010.
            </p>
            <p className="text-muted-foreground mb-4">
              We believe in empowering students with authentic, high-quality books and materials that help them achieve their career goals.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-4">
              To provide students with access to the best competitive exam preparation books at affordable prices, enabling them to succeed in their examinations.
            </p>
            <p className="text-muted-foreground">
              We partner with leading publishers and authors to bring you the latest and most relevant study materials for all major competitive exams.
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-8">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { title: 'Wide Range', desc: 'Books for all major competitive exams' },
            { title: 'Best Prices', desc: 'Competitive prices and regular discounts' },
            { title: 'Fast Delivery', desc: 'Quick shipment across India' },
            { title: 'Authentic Books', desc: '100% original and authentic books' },
            { title: 'Expert Support', desc: 'Knowledgeable customer support team' },
            { title: 'Easy Returns', desc: 'Hassle-free return policy' }
          ].map((item, i) => (
            <Card key={i} className="p-6">
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
