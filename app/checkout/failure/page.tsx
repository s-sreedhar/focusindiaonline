'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { XCircle, AlertCircle, Loader2 } from 'lucide-react';

function FailureContent() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const orderId = searchParams.get('orderId');

    return (
        <div className="max-w-3xl mx-auto px-4 py-16">
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <XCircle className="w-24 h-24 text-red-500" />
                </div>
                <h1 className="text-4xl font-bold text-red-600">Payment Failed</h1>
                <p className="text-muted-foreground text-lg">
                    We couldn't process your payment. Please try again.
                </p>

                <div className="bg-red-50 p-6 rounded-lg max-w-md mx-auto border border-red-100">
                    <div className="flex items-center justify-center gap-2 mb-2 text-red-700 font-semibold">
                        <AlertCircle className="w-5 h-5" />
                        <span>Error Details</span>
                    </div>
                    {orderId && <p className="text-sm text-red-600 mb-1">Transaction ID: {orderId}</p>}
                    {reason && <p className="text-sm text-red-600">Reason: {reason}</p>}
                </div>

                <div className="space-y-4 pt-4">
                    <div className="flex justify-center gap-4">
                        <Button size="lg" asChild>
                            <Link href="/checkout">Try Again</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/contact">Contact Support</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutFailurePage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-24">
                <Suspense fallback={
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                }>
                    <FailureContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
