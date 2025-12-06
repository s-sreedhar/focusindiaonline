'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { clearCart } = useCartStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderId) {
            // Clear cart on successful order
            clearCart();
            setLoading(false);
        }
    }, [orderId, clearCart]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-24">
                <div className="max-w-3xl mx-auto px-4 py-16">
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <CheckCircle className="w-24 h-24 text-green-500" />
                        </div>
                        <h1 className="text-4xl font-bold">Payment Successful!</h1>
                        <p className="text-muted-foreground text-lg">
                            Thank you for your order. Your payment has been processed successfully.
                        </p>

                        {orderId && (
                            <div className="bg-secondary p-6 rounded-lg max-w-md mx-auto">
                                <p className="font-semibold mb-2">Transaction ID: {orderId}</p>
                                <p className="text-sm text-muted-foreground">
                                    You will receive an email confirmation shortly.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4 pt-4">
                            <div className="flex justify-center gap-4">
                                <Button size="lg" asChild>
                                    <Link href="/account/orders">View Your Orders</Link>
                                </Button>
                                <Button variant="outline" size="lg" asChild>
                                    <Link href="/shop">Continue Shopping</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
