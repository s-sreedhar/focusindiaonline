'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/lib/cart-store';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

type Step = 'address' | 'payment' | 'review' | 'confirmation';

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'card'
  });

  const subtotal = getTotalPrice();
  const shippingCharges = subtotal > 500 ? 0 : 50;
  const discount = Math.round(subtotal * 0.05);
  const total = subtotal + shippingCharges - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
  };

  const handlePlaceOrder = () => {
    setCurrentStep('confirmation');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 w-full py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (currentStep === 'confirmation') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-16">
            <div className="text-center space-y-6">
              <div className="text-6xl">✓</div>
              <h1 className="text-4xl font-bold">Order Confirmed!</h1>
              <p className="text-muted-foreground text-lg">
                Thank you for your order. Your books will be delivered soon.
              </p>
              <div className="bg-secondary p-6 rounded-lg">
                <p className="font-semibold mb-2">Order Number: #ORD-2025-001234</p>
                <p className="text-muted-foreground">A confirmation email has been sent to {formData.email}</p>
              </div>
              <div className="space-y-2">
                <Button size="lg" asChild>
                  <Link href="/account/orders">View Order Details</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step Indicators */}
              <div className="flex justify-between mb-8">
                {(['address', 'payment', 'review'] as const).map((step, index) => (
                  <div key={step} className="flex items-center">
                    <button
                      onClick={() => handleStepChange(step)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                        currentStep === step
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {index + 1}
                    </button>
                    {index < 2 && (
                      <div className={`w-16 h-1 mx-2 ${
                        currentStep !== 'address' ? 'bg-primary' : 'bg-secondary'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              {currentStep === 'address' && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                    <Input
                      placeholder="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Input
                    placeholder="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  <Input
                    placeholder="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  <Input
                    placeholder="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="City"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                    <Input
                      placeholder="State"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Input
                    placeholder="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                  />
                  <Button className="w-full" onClick={() => handleStepChange('payment')}>
                    Continue to Payment
                  </Button>
                </Card>
              )}

              {/* Payment Method */}
              {currentStep === 'payment' && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {['card', 'upi', 'netbanking', 'wallet'].map((method) => (
                      <label key={method} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-secondary">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={formData.paymentMethod === method}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <span className="font-semibold capitalize">{method === 'netbanking' ? 'Net Banking' : method.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => handleStepChange('address')}>
                      Back
                    </Button>
                    <Button onClick={() => handleStepChange('review')}>
                      Continue to Review
                    </Button>
                  </div>
                </Card>
              )}

              {/* Order Review */}
              {currentStep === 'review' && (
                <Card className="p-6 space-y-6">
                  <h2 className="text-xl font-bold">Order Review</h2>
                  
                  {/* Address Summary */}
                  <div className="border-b pb-6">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-muted-foreground text-sm">
                      {formData.firstName} {formData.lastName}<br/>
                      {formData.address}<br/>
                      {formData.city}, {formData.state} {formData.zipCode}
                    </p>
                  </div>

                  {/* Payment Summary */}
                  <div className="border-b pb-6">
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <p className="text-muted-foreground text-sm capitalize">
                      {formData.paymentMethod === 'netbanking' ? 'Net Banking' : formData.paymentMethod.toUpperCase()}
                    </p>
                  </div>

                  {/* Items Summary */}
                  <div className="border-b pb-6">
                    <h3 className="font-semibold mb-3">Items</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.bookId} className="flex justify-between text-sm">
                          <span>{item.title} x {item.quantity}</span>
                          <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => handleStepChange('payment')}>
                      Back
                    </Button>
                    <Button onClick={handlePlaceOrder} size="lg">
                      Place Order
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24 space-y-6">
                <h2 className="text-lg font-bold">Order Summary</h2>

                {/* Items */}
                <div className="max-h-48 overflow-y-auto space-y-3 pb-6 border-b">
                  {items.map((item) => (
                    <div key={item.bookId} className="flex justify-between text-sm">
                      <span className="line-clamp-1">{item.title}</span>
                      <span className="flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {shippingCharges > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>₹{shippingCharges}</span>
                    </div>
                  )}
                  {shippingCharges === 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Free Shipping</span>
                      <span>₹0</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount (5%)</span>
                    <span>-₹{discount}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toLocaleString()}</span>
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
