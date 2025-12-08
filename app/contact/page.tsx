import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Focus India Online',
  description: 'Get in touch with Focus India Online. Call us at +919959594444 or email info@timesbookstall.com for any queries about competitive exam books and study materials.',
  openGraph: {
    title: 'Contact Focus India Online',
    description: 'Get in touch with Focus India Online for competitive exam books and study materials.',
    url: 'https://focusindiaonline.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 w-full">
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Have a question or need assistance? We're here to help!
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl -mt-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Phone</h3>
                  <p className="text-muted-foreground text-sm mb-1">Mon-Fri from 8am to 5pm</p>
                  <a href="tel:+919959594444" className="text-primary font-medium hover:underline">+91 99595 94444</a>
                </div>
              </Card>

              <Card className="p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Email</h3>
                  <p className="text-muted-foreground text-sm mb-1">Our friendly team is here to help.</p>
                  <a href="mailto:info@timesbookstall.com" className="text-primary font-medium hover:underline">info@timesbookstall.com</a>
                </div>
              </Card>

              <Card className="p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Address</h3>
                  <p className="text-muted-foreground text-sm">
                    Visit our office HQ at:
                  </p>
                  <p className="font-medium mt-1">Hyderabad, Telangana, India</p>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8 shadow-lg border-none">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    Send us a Message
                  </h2>
                  <p className="text-muted-foreground">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                      <Input id="name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                      <Input id="email" type="email" placeholder="john@example.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <Input id="subject" placeholder="How can we help?" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <Button className="w-full md:w-auto md:px-8" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
