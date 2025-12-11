'use client';

import Link from 'next/link';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 w-full pt-20 md:pt-28">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
            <p className="text-muted-foreground">FocusIndiaOnline.com</p>
          </div>

          <div className="prose max-w-none space-y-8">
            {/* Intro */}
            <p className="text-lg text-muted-foreground">
              By using our website, you agree to the following terms:
            </p>

            {/* General */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">General</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>FocusIndiaOnline.com sells books and study materials for competitive exams.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>By placing an order, you confirm that the information provided is accurate.</span>
                </li>
              </ul>
            </section>

            {/* Pricing */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Pricing</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Prices are subject to change without prior notice.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Payments must be completed before order processing.</span>
                </li>
              </ul>
            </section>

            {/* Order Cancellation */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Order Cancellation</h2>
              <p className="text-muted-foreground mb-4">We reserve the right to cancel orders due to:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Out-of-stock items</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Incorrect pricing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Fraudulent activity</span>
                </li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, images, product descriptions, and materials on this website belong to Focus India Online.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">Focus India Online is not responsible for:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Delivery delays caused by courier services</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Customer-side technical issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Improper handling of delivered books</span>
                </li>
              </ul>
            </section>

            {/* Jurisdiction */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Jurisdiction</h2>
              <p className="text-muted-foreground">
                All disputes are subject to the courts of Hyderabad, Telangana, India.
              </p>
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
                <Link href="/refund-policy" className="text-primary hover:underline">
                  Refund Policy
                </Link>
                <Link href="/cancellation-policy" className="text-primary hover:underline">
                  Cancellation Policy
                </Link>
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
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
