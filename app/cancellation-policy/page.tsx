'use client';

import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 w-full pt-20 md:pt-24">
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h1 className="text-4xl font-bold mb-4">Cancellation Policy</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Understand our cancellation process before you order.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

          <div className="prose max-w-none space-y-8">
            {/* Intro */}
            <p className="text-lg text-muted-foreground">
              Orders can be cancelled only before shipping.
            </p>

            {/* Cancellation Rules */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Cancellation Rules</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Orders can be cancelled only before shipping.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Once shipped, orders cannot be cancelled.</span>
                </li>
              </ul>
            </section>

            {/* Refund for Cancellation */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Refund for Cancellation</h2>
              <p className="text-muted-foreground mb-4">
                For prepaid orders cancelled before dispatch, refund will be issued within 7–10 business days.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-blue-900 text-sm">
                  <strong>Note:</strong> The refund amount will be credited to the original payment method used during purchase.
                </p>
              </div>
            </section>

            {/* How to Cancel */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">How to Cancel Your Order</h2>
              <p className="text-muted-foreground mb-4">
                To cancel your order before it ships, please contact our support team immediately with your order number:
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

            {/* Already Shipped */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">If Your Order is Already Shipped</h2>
              <p className="text-muted-foreground">
                If your order has already been shipped, you cannot cancel it. However, you can proceed with the return process as per our <Link href="/returns" className="text-primary hover:underline">Returns Policy</Link>.
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
