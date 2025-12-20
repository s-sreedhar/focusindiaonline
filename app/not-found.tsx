'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ShoppingBag, MapPin } from 'lucide-react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />

            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="space-y-6 max-w-lg mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                        <MapPin className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                            Page Not Found
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            It seems you've ventured into uncharted territory. The page you are looking for might have been moved or doesn't exist.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <Button asChild size="lg" className="rounded-full px-8">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                            <Link href="/shop">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Browse Shop
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
