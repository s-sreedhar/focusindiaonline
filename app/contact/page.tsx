import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6">
            <Phone className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-bold mb-2">Phone</h3>
            <p className="text-muted-foreground">+919959594444</p>
          </Card>
          <Card className="p-6">
            <Mail className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-bold mb-2">Email</h3>
            <p className="text-muted-foreground">info@timesbookstall.com</p>
          </Card>
          <Card className="p-6">
            <MapPin className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-bold mb-2">Address</h3>
            <p className="text-muted-foreground">Hyderabad, India</p>
          </Card>
        </div>

        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
          <form className="space-y-4">
            <Input placeholder="Your Name" />
            <Input type="email" placeholder="Your Email" />
            <Input placeholder="Subject" />
            <textarea
              placeholder="Message"
              rows={5}
              className="w-full px-4 py-2 border border-input rounded-md"
            />
            <Button className="w-full">Send Message</Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
