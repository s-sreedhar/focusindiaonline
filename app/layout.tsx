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
        <a
          href="https://wa.me/919390861116"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3 rounded-full shadow-lg hover:bg-[#20b858] transition-all hover:scale-110 flex items-center justify-center group"
          aria-label="Chat on WhatsApp"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </body>
    </html>
  )
}
