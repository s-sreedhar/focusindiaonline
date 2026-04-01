'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, HelpCircle, RefreshCcw, PhoneCall, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

function PaymentFailureContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const errorMsg = searchParams.get('error') || 'Your payment could not be processed at this time.';

    return (
        <div className="text-center space-y-8">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-200"
            >
                <XCircle className="w-14 h-14" />
            </motion.div>

            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight text-red-600">Payment Failed</h1>
                <p className="text-xl text-muted-foreground max-w-md mx-auto">
                    {errorMsg}
                </p>
            </div>

            <Card className="p-8 border-none shadow-xl shadow-gray-200/50 bg-white space-y-6">
                <div className="text-left space-y-4">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary" />
                        Common reasons for failure:
                    </h2>
                    <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
                        <li>Insufficient funds in your account</li>
                        <li>Incorrect card details or OTP</li>
                        <li>Payment timeout from the bank side</li>
                        <li>International transaction not enabled (for some cards)</li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button asChild className="flex-1 rounded-2xl h-14 text-lg bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200/50">
                        <Link href={orderId ? `/checkout?orderId=${orderId}` : '/checkout'}>
                            <RefreshCcw className="w-5 h-5 mr-2" />
                            Retry Payment
                        </Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1 rounded-2xl h-14 text-lg bg-white">
                        <Link href="/shop">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Shop
                        </Link>
                    </Button>
                </div>
            </Card>

            <div className="pt-8 flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-muted-foreground">Need help with your order?</p>
                <div className="flex gap-4">
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 border border-blue-100 text-blue-600 bg-blue-50/50">
                        <PhoneCall className="w-4 h-4" />
                        Call Support
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 border border-purple-100 text-purple-600 bg-purple-50/50">
                        <HelpCircle className="w-4 h-4" />
                        WhatsApp
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentFailurePage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />

            <main className="flex-1 pt-32 pb-20">
                <div className="container max-w-2xl mx-auto px-4">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center space-y-4 py-20">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-muted-foreground animate-pulse font-medium">Loading details...</p>
                        </div>
                    }>
                        <PaymentFailureContent />
                    </Suspense>
                </div>
            </main>

            <Footer />
        </div>
    );
}

