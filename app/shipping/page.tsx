import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Card } from '@/components/ui/card';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <h1 className="text-4xl font-bold mb-8">Shipping & Delivery</h1>
        
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Delivery Timeline</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li>• <strong>Standard Delivery:</strong> 3-5 business days across India</li>
              <li>• <strong>Express Delivery:</strong> 1-2 business days (available in major cities)</li>
              <li>• <strong>Free Shipping:</strong> On orders above ₹500</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Shipping Charges</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>• Orders up to ₹500: ₹50 shipping charge</p>
              <p>• Orders ₹500 and above: FREE shipping</p>
              <p>• Express delivery: ₹100 additional charge</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Packaging</h2>
            <p className="text-muted-foreground mb-3">
              We ensure safe and secure packaging for all orders. Books are wrapped carefully to prevent damage during transit.
            </p>
            <p className="text-muted-foreground">
              All shipments are insured and tracked. You will receive a tracking ID via email once your order is dispatched.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Tracking Your Order</h2>
            <p className="text-muted-foreground mb-3">
              You can track your order using the tracking ID provided in your order confirmation email. Our courier partners provide real-time updates.
            </p>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
