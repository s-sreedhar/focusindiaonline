'use client';

import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 w-full pt-20 md:pt-24">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Your privacy is our priority.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl mt-8 pb-16 space-y-8">
          <div className="prose max-w-none space-y-8">
            {/* Intro */}
            <p className="text-lg text-muted-foreground">
              Your privacy is important to us. This policy explains how we collect and use your information.
            </p>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Name, email, mobile number</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Shipping address</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Payment information (handled securely by payment gateway)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>Website usage data</span>
                </li>
              </ul>
            </section>

            {/* How We Use */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>To process and deliver orders</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>To communicate updates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>To improve website performance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>To prevent fraud and enhance security</span>
                </li>
              </ul>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Protection</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>We do NOT store card/payment details.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>We do not sell or share your data with third parties, except delivery partners.</span>
                </li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies to improve browsing experience.
              </p>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">User Rights</h2>
              <p className="text-muted-foreground">
                You can request to update or delete your data anytime.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-slate-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
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
                <Link href="/refund-policy" className="text-primary hover:underline">
                  Refund Policy
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
