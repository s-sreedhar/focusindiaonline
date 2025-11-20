import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Card } from '@/components/ui/card';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <h1 className="text-4xl font-bold mb-8">Returns & Refunds</h1>
        
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Return Policy</h2>
            <p className="text-muted-foreground mb-4">
              We offer a hassle-free return policy to ensure customer satisfaction.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Books must be in unused and original condition</li>
              <li>• Return requests must be initiated within 7 days of delivery</li>
              <li>• Original packaging and receipt must be provided</li>
              <li>• Refunds are processed within 5-7 business days</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">How to Initiate a Return</h2>
            <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
              <li>Contact our support team at +919959594444 or info@timesbookstall.com</li>
              <li>Provide your order ID and reason for return</li>
              <li>We will send you a return shipping label</li>
              <li>Ship the item back to us using the provided label</li>
              <li>We will verify the item and process your refund</li>
            </ol>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Refund Process</h2>
            <p className="text-muted-foreground mb-3">
              Once we receive and verify the returned item, refunds are processed to the original payment method within 5-7 business days.
            </p>
            <p className="text-muted-foreground">
              If the book shows signs of use or damage, the return may be rejected and the item will be shipped back to you.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Damaged Items</h2>
            <p className="text-muted-foreground">
              If you receive a damaged or defective item, please contact us immediately with photos of the damage. We will replace the item or process a full refund at no cost to you.
            </p>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
