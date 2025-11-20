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

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const subtotal = getTotalPrice();
  const shippingCharges = subtotal > 500 ? 0 : 50;
  const discount = Math.round(subtotal * 0.05);
  const total = subtotal + shippingCharges - discount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <Header />

        <main className="flex-1 container mx-auto px-4 max-w-[1600px] w-full py-16 flex items-center justify-center">
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

      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-[1600px] py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold break-words">Shopping Cart</h1>
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
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount (5%)</span>
                      <span>-₹{discount}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">₹{total.toLocaleString()}</span>
                  </div>

                  {/* Coupon Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Promo Code</label>
                    <div className="flex gap-2">
                      <Input placeholder="Enter code" className="bg-gray-50" />
                      <Button variant="outline">Apply</Button>
                    </div>
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
