'use client';

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { CartItemComponent } from '@/components/cart-item';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/lib/cart-store';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = getTotalPrice();
  const shippingCharges = subtotal > 500 ? 0 : 50;

  // Calculate discount based on applied coupon
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else {
      discount = appliedCoupon.value;
    }
  }

  const total = subtotal + shippingCharges - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');

    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError('Invalid coupon code');
        return;
      }

      const couponDoc = querySnapshot.docs[0];
      const coupon = couponDoc.data();

      if (!coupon.isActive) {
        setCouponError('This coupon is currently inactive');
        return;
      }

      const now = new Date();
      const expiry = coupon.expiryDate?.toDate ? coupon.expiryDate.toDate() : new Date(coupon.expiryDate);
      if (now > expiry) {
        setCouponError(`This coupon expired on ${expiry.toLocaleDateString()}`);
        return;
      }

      if (subtotal < coupon.minPurchaseAmount) {
        setCouponError(`Minimum purchase of ₹${coupon.minPurchaseAmount} required`);
        return;
      }

      applyCoupon({
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        minPurchaseAmount: coupon.minPurchaseAmount
      });
      setCouponCode('');
      toast.success('Coupon applied successfully');
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    toast.info('Coupon removed');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <Header />

        <main className="flex-1 container mx-auto px-4 max-w-[1600px] w-full pt-24 pb-16 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 bg-white p-12 rounded-3xl shadow-sm max-w-md w-full"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">Looks like you haven't added any books yet.</p>
            <Button asChild size="lg" className="rounded-full px-8 w-full">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </motion.div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 max-w-[1600px] py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold break-words pb-2 leading-tight">Shopping Cart</h1>
            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearCart}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.bookId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <CartItemComponent
                      item={item}
                      onUpdateQuantity={(qty) => updateQuantity(item.bookId, qty)}
                      onRemove={() => removeItem(item.bookId)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 sticky top-24 space-y-6 border-none shadow-lg">
                  <h2 className="text-xl font-bold">Order Summary</h2>

                  {/* Pricing Breakdown */}
                  <div className="space-y-3 pb-6 border-b">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="text-foreground font-medium">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Shipping</span>
                      <span className={shippingCharges === 0 ? "text-green-600 font-medium" : "text-foreground font-medium"}>
                        {shippingCharges === 0 ? "Free" : `₹${shippingCharges}`}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">₹{total.toLocaleString()}</span>
                  </div>

                  {/* Coupon Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Coupon Code</label>
                    {appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-green-700 text-sm">{appliedCoupon.code}</p>
                          <p className="text-xs text-green-600">
                            {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`}
                          </p>
                        </div>
                        <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code"
                          className="bg-gray-50"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading}>
                          {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                    )}
                    {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button className="w-full rounded-full h-12 text-lg shadow-lg shadow-primary/20" asChild>
                      <Link href="/checkout">
                        Checkout <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full rounded-full" asChild>
                      <Link href="/shop">Continue Shopping</Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
