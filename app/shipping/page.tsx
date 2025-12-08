import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Card } from '@/components/ui/card';
import { Truck, Clock, IndianRupee, MapPin, Box, ShieldCheck } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 w-full">
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h1 className="text-4xl font-bold mb-4">Shipping & Delivery</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Transparent policies and fast delivery across India.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl -mt-8 pb-16 space-y-8">
          <Card className="p-8 shadow-lg border-none">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Delivery Timeline</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> Standard Delivery
                </h3>
                <p className="text-muted-foreground">3-5 business days across India</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> Express Delivery
                </h3>
                <p className="text-muted-foreground">1-2 business days (metro cities)</p>
              </div>
            </div>
            <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Free Shipping on orders above ₹500
              </p>
            </div>
          </Card>

          <Card className="p-8 shadow-lg border-none">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Shipping Charges</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex items-center justify-between p-3 border-b last:border-0">
                <span className="text-muted-foreground">Orders up to ₹500</span>
                <span className="font-semibold">₹50 flat rate</span>
              </li>
              <li className="flex items-center justify-between p-3 border-b last:border-0">
                <span className="text-muted-foreground">Orders above ₹500</span>
                <span className="font-semibold text-green-600">FREE</span>
              </li>
              <li className="flex items-center justify-between p-3">
                <span className="text-muted-foreground">Express Delivery surcharge</span>
                <span className="font-semibold">₹100 extra</span>
              </li>
            </ul>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6 border-none shadow-md">
              <div className="flex items-start gap-4">
                <Box className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Secure Packaging</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We ensure safe and waterproof packaging to prevent any damage during transit. Your books arrive in pristine condition.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-none shadow-md">
              <div className="flex items-start gap-4">
                <MapPin className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Live Tracking</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Once dispatched, you'll receive a tracking ID via email and SMS to track your package in real-time.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
