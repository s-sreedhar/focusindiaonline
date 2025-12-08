import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Card } from '@/components/ui/card';
import { RefreshCcw, CheckCircle2, AlertCircle, Phone, Mail } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 w-full">
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h1 className="text-4xl font-bold mb-4">Returns & Refunds</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Hassle-free returns because your satisfaction matters.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl -mt-8 pb-16 space-y-8">

          {/* Policy Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="bg-green-100 p-3 rounded-full text-green-600 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold">7-Day Return</h3>
              <p className="text-sm text-muted-foreground">Easy returns within 7 days of delivery</p>
            </Card>
            <Card className="p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-3">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <h3 className="font-bold">Full Refund</h3>
              <p className="text-sm text-muted-foreground">100% refund for valid returns</p>
            </Card>
            <Card className="p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="bg-orange-100 p-3 rounded-full text-orange-600 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold">Damaged Item?</h3>
              <p className="text-sm text-muted-foreground">Instant replacement for damaged books</p>
            </Card>
          </div>

          <Card className="p-8 shadow-lg border-none">
            <h2 className="text-2xl font-bold mb-6">Return Policy Framework</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We strive to ensure every book you order meets your expectations. However, if you're not completely satisfied, we're here to help.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full p-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /></span>
                  <span><strong>Condition:</strong> Books must be unused, unmarked, and in their original condition.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full p-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /></span>
                  <span><strong>Packaging:</strong> Please keep the original packaging and receipt/invoice intact.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full p-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /></span>
                  <span><strong>Timing:</strong> Initiate the return request within 7 days of receiving your order.</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-8 shadow-lg border-none">
            <h2 className="text-2xl font-bold mb-8">How to Initiate a Return</h2>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-muted hidden md:block"></div>

              <div className="space-y-8">
                {[
                  { step: 1, title: 'Contact Support', desc: 'Call us at +91 99595 94444 or email info@timesbookstall.com with your Order ID.' },
                  { step: 2, title: 'Verification', desc: 'Our team will verify your request and approve the return within 24 hours.' },
                  { step: 3, title: 'Ship Back', desc: 'We will provide a return shipping label. Pack the item securely and ship it back.' },
                  { step: 4, title: 'Refund Processed', desc: 'Once we receive the item, your refund will be processed within 5-7 business days.' }
                ].map((item) => (
                  <div key={item.step} className="flex gap-6 relative bg-white md:bg-transparent p-4 md:p-0 rounded-lg border md:border-none">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg z-10">
                      {item.step}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-muted-foreground/30 text-center">
            <h3 className="font-bold mb-2">Need Immediate Assistance?</h3>
            <p className="text-sm text-muted-foreground mb-4">Our support team is available Mon-Fri, 9am - 6pm</p>
            <div className="flex justify-center gap-6">
              <a href="tel:+919959594444" className="flex items-center gap-2 text-primary font-medium hover:underline">
                <Phone className="w-4 h-4" /> Call Us
              </a>
              <a href="mailto:info@timesbookstall.com" className="flex items-center gap-2 text-primary font-medium hover:underline">
                <Mail className="w-4 h-4" /> Email Us
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
