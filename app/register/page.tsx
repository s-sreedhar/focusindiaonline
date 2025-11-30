import { PhoneRegister } from '@/components/auth/phone-register';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create a new account at Focus India Online. Register with your mobile number to start shopping for competitive exam books.',
  openGraph: {
    title: 'Register - Focus India Online',
    description: 'Create a new account at Focus India Online',
    url: 'https://focusindiaonline.com/register',
  },
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <PhoneRegister />
      </main>
      <Footer />
    </div>
  );
}
