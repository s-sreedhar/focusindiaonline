'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Order } from '@/lib/types';
import { CheckCircle2, Package, Calendar, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const router = useRouter();
    
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusConfirmed, setStatusConfirmed] = useState(false);
    const [waitingTooLong, setWaitingTooLong] = useState(false);

    useEffect(() => {
        if (!orderId) {
            router.push('/');
            return;
        }

        // Set a timeout for slow webhook processing
        const timeoutId = setTimeout(() => {
            setWaitingTooLong(true);
        }, 30000); // 30 seconds

        // Listen for real-time updates to see when webhook updates the status
        const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Order;
                setOrder(data);
                setLoading(false);
                
                // If status is no longer 'payment_pending', it means webhook hit!
                if (data.status !== 'payment_pending') {
                    setStatusConfirmed(true);
                    clearTimeout(timeoutId);
                    setWaitingTooLong(false);
                }
            } else {
                setLoading(false);
            }
        }, (error) => {
            console.error('Error listening to order:', error);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [orderId, router]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse font-medium">Confirming your order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 py-20">
                <Card className="max-w-md w-full p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-bold">Order Not Found</h1>
                    <p className="text-muted-foreground">We couldn't retrieve the details for this order. Please check your account.</p>
                    <Button asChild className="w-full rounded-full">
                        <Link href="/account/orders">Go to My Orders</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto px-4">
            {/* Success Animation Section */}
            <div className="text-center space-y-6 mb-12">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20,
                        delay: 0.1 
                    }}
                    className="relative inline-block"
                >
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-200">
                        <CheckCircle2 className="w-14 h-14 text-white" />
                    </div>
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -inset-4 border-4 border-green-500/20 rounded-full"
                    />
                </motion.div>

                <div className="space-y-2">
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-black tracking-tight sm:text-5xl"
                    >
                        Order Confirmed!
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-muted-foreground"
                    >
                        Thank you for your purchase. We've received your order.
                    </motion.p>
                </div>

                {!statusConfirmed && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 py-2 px-4 rounded-full w-fit mx-auto border border-amber-100">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>
                                {waitingTooLong 
                                    ? "Still processing... This is taking longer than usual."
                                    : "Wait a moment, we're finalizing your payment details..."}
                            </span>
                        </div>
                        {waitingTooLong && (
                            <p className="text-xs text-muted-foreground text-center max-w-md mx-auto">
                                Don't worry, your payment was successful. The confirmation is being processed. 
                                You can safely leave this page - we'll send you an email confirmation.
                            </p>
                        )}
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Order Details Left Column */}
                <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-6"
                >
                    <Card className="p-6 border-none shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            Order Summary
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Date
                                </span>
                                <span className="font-semibold">
                                    {order.createdAt?.seconds 
                                        ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() 
                                        : new Date().toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                <span className="text-muted-foreground">Order ID</span>
                                <span className="font-mono text-xs font-bold text-primary">#{order.id}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                <span className="text-muted-foreground">Payment Status</span>
                                <Badge variant={order.status === 'payment_pending' ? 'outline' : 'secondary'} className={order.status === 'payment_pending' ? '' : 'bg-green-100 text-green-700 border-none'}>
                                    {order.status === 'payment_pending' ? 'Syncing...' : 'Success'}
                                </Badge>
                            </div>
                            <div className="pt-4 flex justify-between items-center text-lg font-bold">
                                <span>Total Paid</span>
                                <span className="text-2xl text-primary font-black">₹{order.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild className="flex-1 rounded-2xl h-14 text-lg shadow-lg shadow-primary/20">
                            <Link href={`/account/orders/${order.id}`}>
                                Track Order <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="flex-1 rounded-2xl h-14 text-lg bg-white">
                            <Link href="/shop">Continue Shopping</Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Right Column - Shipping & Message */}
                <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-6"
                >
                    <Card className="p-6 border-none shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm h-full">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Shipping to
                        </h2>
                        <div className="space-y-2 text-sm leading-relaxed">
                            <p className="font-bold text-lg">{order.shippingAddress.fullName}</p>
                            <div className="text-muted-foreground">
                                <p>{order.shippingAddress.doorNo && `${order.shippingAddress.doorNo}, `}{order.shippingAddress.street}</p>
                                <p>{order.shippingAddress.villageTown && `${order.shippingAddress.villageTown}, `}{order.shippingAddress.mandal}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-50 mt-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                                        <Package className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold">What's next?</p>
                                        <p className="text-xs text-muted-foreground">We'll notify you as soon as your order has been shipped. Usually within 24-48 hours.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />

            <main className="flex-1 pt-32 pb-20 overflow-hidden">
                <Suspense fallback={
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground animate-pulse font-medium">Loading your order details...</p>
                    </div>
                }>
                    <PaymentSuccessContent />
                </Suspense>
            </main>

            <Footer />
        </div>
    );
}

function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'outline' | 'secondary', className?: string }) {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider";
    const variants = {
        default: "bg-primary text-primary-foreground",
        outline: "border border-muted text-muted-foreground",
        secondary: "bg-secondary text-secondary-foreground"
    };
    
    return (
        <span className={`${baseClasses} ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
