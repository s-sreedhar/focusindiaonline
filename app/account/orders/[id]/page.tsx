'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, MapPin, Phone, Mail } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Order } from '@/lib/types';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

export default function OrderDetailsPage() {
    const { id } = useParams();
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchOrder = async () => {
            if (!id || typeof id !== 'string') return;

            try {
                const orderDoc = await getDoc(doc(db, 'orders', id));
                if (orderDoc.exists()) {
                    const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;
                    // Verify ownership
                    if (user?.id && orderData.userId !== user.id) {
                        router.push('/account/orders');
                        return;
                    }
                    setOrder(orderData);
                }
            } catch (error) {
                //console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, isAuthenticated, router, user]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex justify-center items-center pt-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col justify-center items-center pt-20 gap-4">
                    <h1 className="text-2xl font-bold">Order Not Found</h1>
                    <Button asChild>
                        <Link href="/account/orders">Back to Orders</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'shipped': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            case 'placed': return 'bg-purple-100 text-purple-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'returned': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <Button variant="ghost" asChild className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/account/orders" className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Orders
                        </Link>
                    </Button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Order #{order.id.slice(0, 8)}</h1>
                            <p className="text-muted-foreground">
                                Placed on {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}
                            </p>
                        </div>
                        <Badge variant="outline" className={`px-4 py-1.5 text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Order Items */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="p-6">
                                <h2 className="font-semibold text-lg mb-4">Items</h2>
                                <div className="space-y-4">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-start py-4 border-b last:border-0">
                                            <div>
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ₹{item.price}</p>
                                            </div>
                                            <p className="font-semibold">₹{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>₹{order.totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>Free</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                        <span>Total</span>
                                        <span className="text-primary">₹{order.totalAmount}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Shipping Info */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h2 className="font-semibold text-lg mb-4">Shipping Details</h2>
                                <div className="space-y-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <UserIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{order.shippingAddress.fullName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                        <div>
                                            <p>{order.shippingAddress.street}</p>
                                            <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                                            <p>{order.shippingAddress.zipCode}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <p>{order.shippingAddress.phoneNumber}</p>
                                    </div>
                                    {order.shippingAddress.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <p>{order.shippingAddress.email}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="font-semibold text-lg mb-4">Payment</h2>
                                <div className="text-sm">
                                    <p className="text-muted-foreground mb-1">Method</p>
                                    <p className="font-medium capitalize">{order.paymentMethod}</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
