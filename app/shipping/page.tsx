'use client';

import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Shipping Policy</h1>
            <p className="text-muted-foreground">FocusIndiaOnline.com</p>
          </div>

          <div className="prose max-w-none space-y-8">
            {/* Intro */}
            <p className="text-lg text-muted-foreground">
              At Focus India Online, we ensure timely and safe delivery of all competitive exam books and study materials.
            </p>

            {/* Shipping Time */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Shipping Time</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Orders are processed within 1–2 business days.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Delivery within 5–7 business days for major cities.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Delivery within 7–10 business days for other locations.</span>
                </li>
              </ul>
            </section>

            {/* Shipping Charges */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Shipping Charges</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Shipping charges (if any) are displayed at checkout.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Free delivery may be offered on selected orders.</span>
                </li>
              </ul>
            </section>

            {/* Order Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Order Tracking</h2>
              <p className="text-muted-foreground">
                Once your order is shipped, a tracking link will be shared via SMS/Email.
              </p>
            </section>

            {/* Delivery Delays */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Delivery Delays</h2>
              <p className="text-muted-foreground mb-4">Delivery may be delayed due to:</p>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Courier delays</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Weather conditions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Remote area shipping</span>
                </li>
              </ul>
              <p className="text-muted-foreground">
                If delays occur, our support team will assist you.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-slate-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact for Delivery Issues</h2>
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
                <Link href="/returns" className="text-primary hover:underline">
                  Returns Policy
                </Link>
                <Link href="/refund-policy" className="text-primary hover:underline">
                  Refund Policy
                </Link>
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-primary hover:underline">
                  Terms & Conditions
                </Link>
                <Link href="/cancellation-policy" className="text-primary hover:underline">
                  Cancellation Policy
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
