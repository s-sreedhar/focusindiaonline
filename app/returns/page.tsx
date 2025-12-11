'use client';

import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
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

        <div className="container mx-auto px-4 max-w-4xl mt-8 pb-16 space-y-8">

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

          <div className="prose max-w-none space-y-8">
            {/* Intro */}
            <p className="text-lg text-muted-foreground">
              We accept returns only under valid conditions.
            </p>

            {/* Valid Returns */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">You can request a return if:</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>You received a damaged book</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>You received a wrong product</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Pages are missing / printing errors</span>
                </li>
              </ul>
            </section>

            {/* Conditions */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Conditions for Return:</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Return request must be made within 3 days of delivery.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>The product must be unused and in its original condition.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Proof (photo/video) of the issue is required.</span>
                </li>
              </ul>
            </section>

            {/* Not Eligible */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Products Not Eligible for Return</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Digital products / PDF materials</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Books damaged by the customer</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Books with minor external wear caused during shipping</span>
                </li>
              </ul>
            </section>

            {/* Return Process */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">How to Request a Return</h2>
              <p className="text-muted-foreground mb-4">
                For return requests, contact support with your order number:
              </p>
              <div className="bg-slate-50 p-6 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <a href="tel:+919390861116" className="text-primary hover:underline">
                    +91 93908 61116
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <a href="mailto:support@focusindiaonline.com" className="text-primary hover:underline">
                    support@focusindiaonline.com
                  </a>
                </div>
              </div>
            </section>

            {/* Related Links */}
            <div className="border-t pt-8">
              <p className="text-sm text-muted-foreground mb-4">Related Policies:</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/shipping" className="text-primary hover:underline">
                  Shipping Policy
                </Link>
                <Link href="/refund-policy" className="text-primary hover:underline">
                  Refund Policy
                </Link>
                <Link href="/cancellation-policy" className="text-primary hover:underline">
                  Cancellation Policy
                </Link>
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-primary hover:underline">
                  Terms & Conditions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
