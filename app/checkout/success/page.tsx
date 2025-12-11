'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { motion } from 'framer-motion';

function SuccessContent() {
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
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg bg-background/60 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 md:p-12 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold mb-3 tracking-tight"
                >
                    Payment Successful!
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-lg mb-8"
                >
                    Thank you for your purchase. Your order has been confirmed.
                </motion.p>

                {orderId && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-secondary/50 rounded-xl p-4 mb-8"
                    >
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Order ID</p>
                        <p className="font-mono text-lg font-semibold">{orderId}</p>
                    </motion.div>
                )}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                >
                    <Button size="lg" className="w-full rounded-xl h-12 text-base font-medium bg-black hover:bg-black/90 text-white shadow-lg transition-transform active:scale-95" asChild>
                        <Link href="/account/orders">
                            View Your Orders <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="lg" className="w-full rounded-xl h-12 text-base font-medium hover:bg-secondary/50" asChild>
                        <Link href="/shop">
                            <ShoppingBag className="w-4 h-4 mr-2" /> Continue Shopping
                        </Link>
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 pt-20">
                <Suspense fallback={
                    <div className="flex justify-center items-center h-[80vh]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                }>
                    <SuccessContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
