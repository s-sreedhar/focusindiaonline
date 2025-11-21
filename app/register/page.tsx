import { PhoneLogin } from '@/components/auth/phone-login';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <PhoneLogin />
      </main>
      <Footer />
    </div>
  );
}
