'use client';

import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Refund Policy</h1>
            <p className="text-muted-foreground">FocusIndiaOnline.com</p>
          </div>

          <div className="prose max-w-none space-y-8">
            {/* Intro */}
            <p className="text-lg text-muted-foreground">
              Refunds are processed based on the return/complaint type.
            </p>

            {/* Refund Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Refunds are issued for:</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Damaged or defective product</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Wrong product delivered</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Order cancelled before shipping</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Payment deducted but order not confirmed</span>
                </li>
              </ul>
            </section>

            {/* Refund Method */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Refund Method</h2>
              <p className="text-muted-foreground">
                Refund will be credited to the original payment method.
              </p>
            </section>

            {/* Refund Timeline */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Refund Timeline</h2>
              <p className="text-muted-foreground">
                Once approved, refund will be processed within 7–10 business days.
              </p>
            </section>

            {/* Non-Refundable */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Non-Refundable Situations</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Customer changes mind after order is shipped</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Digital products (PDFs) already delivered</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Incorrect address provided by customer</span>
                </li>
              </ul>
            </section>

            {/* Contact */}
            <section className="bg-slate-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact for Refund Status</h2>
              <div className="space-y-3">
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
                <Link href="/returns" className="text-primary hover:underline">
                  Returns Policy
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
