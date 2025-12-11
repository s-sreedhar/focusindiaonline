'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { XCircle, AlertCircle, Loader2, ArrowRight, RefreshCcw, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function FailureContent() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const orderId = searchParams.get('orderId');

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
                    className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <XCircle className="w-12 h-12 text-red-600" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold mb-3 tracking-tight text-red-600"
                >
                    Payment Failed
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-lg mb-8"
                >
                    We couldn't process your payment. Don't worry, you haven't been charged.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-red-50/50 border border-red-100 rounded-xl p-4 mb-8 text-left"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-700">Error Details</span>
                    </div>
                    {orderId && (
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-red-500">Transaction ID:</span>
                            <span className="font-mono font-medium text-red-700">{orderId}</span>
                        </div>
                    )}
                    {reason && (
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-red-500">Reason:</span>
                            <span className="font-medium text-red-700 capitalize">{reason.replace(/_/g, ' ')}</span>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                >
                    <Button size="lg" className="w-full rounded-xl h-12 text-base font-medium bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 transition-transform active:scale-95" asChild>
                        <Link href="/checkout">
                            <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
                        </Link>
                    </Button>
                    <Button variant="ghost" size="lg" className="w-full rounded-xl h-12 text-base font-medium hover:bg-secondary/50" asChild>
                        <Link href="/contact">
                            <HelpCircle className="w-4 h-4 mr-2" /> Contact Support
                        </Link>
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function CheckoutFailurePage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 pt-20">
                <Suspense fallback={
                    <div className="flex justify-center items-center h-[80vh]">
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
