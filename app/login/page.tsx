import { PhoneLogin } from '@/components/auth/phone-login';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your Focus India Online account. Access your orders, wishlist, and account details.',
  openGraph: {
    title: 'Login - Focus India Online',
    description: 'Login to your Focus India Online account',
    url: 'https://focusindiaonline.com/login',
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 pt-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <PhoneLogin />
      </main>
      <Footer />
    </div>
  );
}
