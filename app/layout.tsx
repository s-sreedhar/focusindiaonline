import type { Metadata } from 'next'
// import { Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import { WishlistSync } from '@/components/wishlist-sync'
import { CartSync } from '@/components/cart-sync'
import { GlobalPopup } from '@/components/global-popup'
import { MobileNav } from '@/components/layouts/mobile-nav'

// Temporary fallback for offline build
const outfit = {
  variable: 'font-sans',
};

/*
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});
*/

export const metadata: Metadata = {
  metadataBase: new URL('https://focusindiaonline.com'),
  title: {
    default: 'Focus India Online - Competitive Exam Books & Study Materials',
    template: '%s | Focus India Online',
  },
  description: 'Premium competitive exam books for UPSC, SSC, RRB, Banking, APPSC, TGPSC and more. Authentic study materials at best prices with fast delivery across India.',
  keywords: ['competitive exam books', 'UPSC books', 'SSC books', 'RRB books', 'Banking exam books', 'APPSC books', 'TGPSC books', 'study materials', 'exam preparation', 'Focus India Online'],
  authors: [{ name: 'Focus India Online' }],
  creator: 'Focus India Online',
  publisher: 'Focus India Online',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://focusindiaonline.com',
    siteName: 'Focus India Online',
    title: 'Focus India Online - Competitive Exam Books & Study Materials',
    description: 'Premium competitive exam books for UPSC, SSC, RRB, Banking, APPSC, TGPSC and more. Authentic study materials at best prices.',
    images: [
      {
        url: '/favicon.svg',
        width: 1200,
        height: 630,
        alt: 'Focus India Online - Competitive Exam Books',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Focus India Online - Competitive Exam Books',
    description: 'Premium competitive exam books for UPSC, SSC, RRB, Banking, APPSC, TGPSC and more.',
    images: ['/favicon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Focus India Online',
    url: 'https://focusindiaonline.com',
    logo: 'https://focusindiaonline.com/favicon.svg',
    description: 'Premium competitive exam books and study materials for UPSC, SSC, RRB, Banking, APPSC, TGPSC and more.',
    sameAs: [
      // Add social media links here when available
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Focus India Online',
    url: 'https://focusindiaonline.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://focusindiaonline.com/shop?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationSchema, websiteSchema]) }}
        />
      </head>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <MobileNav />
          <Toaster />
          <WishlistSync />
          <CartSync />
          <GlobalPopup />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
