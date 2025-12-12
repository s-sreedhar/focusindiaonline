'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { ChevronDown, Loader2, Phone, Lock, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { generateOrderId } from '@/lib/utils/order-id';
import { calculateShippingCharges, INDIAN_STATES } from '@/lib/utils/shipping';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Step = 'address' | 'payment' | 'review' | 'verification';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart, appliedCoupon: storeCoupon, applyCoupon: setStoreCoupon, removeCoupon: removeStoreCoupon } = useCartStore();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Phone Auth State
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getTotalPrice();

  // Calculate total weight and shipping
  const totalWeight = items.reduce((sum, item) => {
    // Basic weight assumption if missing: 500g
    // In a real scenario, we should have fetched the weight. 
    // Assuming 'item' has weight or we might need to fetch it?
    // The cart item type currently might not have weight.
    // Let's check Cart Store item type. If not present, we can't calculate accurately without fetching.
    // However, given the context, we likely need to ensure Cart Items have weight.
    // For now, let's assume item object has it or default to 500g per book.
    const weight = (item as any).weight || 500;
    return sum + (weight * item.quantity);
  }, 0);

  const [shippingDetails, setShippingDetails] = useState<{ charges: number, zone: string, weightUsed: number } | null>(null);

  const shippingCharges = shippingDetails ? shippingDetails.charges : 0;

  useEffect(() => {
    if (formData.state) {
      const details = calculateShippingCharges(totalWeight, formData.state);
      setShippingDetails(details);
    }
  }, [formData.state, totalWeight]);

  const [openState, setOpenState] = useState(false);

  // Sync coupon from store
  useEffect(() => {
    if (storeCoupon) {
      let amount = 0;
      if (storeCoupon.type === 'percentage') {
        amount = Math.round((subtotal * storeCoupon.value) / 100);
      } else {
        amount = storeCoupon.value;
      }
      amount = Math.min(amount, subtotal);

      // Only update if different to avoid loop loops (though useEffect dependency handles it)
      if (!appliedCoupon || appliedCoupon.code !== storeCoupon.code || appliedCoupon.discountAmount !== amount) {
        setAppliedCoupon({
          code: storeCoupon.code,
          type: storeCoupon.type,
          value: storeCoupon.value,
          discountAmount: amount,
        });
      }
    } else {
      if (appliedCoupon) setAppliedCoupon(null);
    }
  }, [storeCoupon, subtotal]);

  // Pre-fill data if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        firstName: user.displayName?.split(' ')[0] || prev.firstName,
        lastName: user.displayName?.split(' ')[1] || prev.lastName,
      }));
    }
  }, [user]);

  // Calculate total with coupon
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal + shippingCharges - discount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    // Don't clear immediately, wait for validation

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
        const msg = 'This coupon is currently inactive';
        setCouponError(msg);
        toast.error(msg);
        return;
      }

      const now = new Date();
      const expiry = coupon.expiryDate?.toDate ? coupon.expiryDate.toDate() : new Date(coupon.expiryDate);
      if (now > expiry) {
        const msg = `This coupon expired on ${expiry.toLocaleDateString()}`;
        setCouponError(msg);
        toast.error(msg);
        return;
      }

      if (subtotal < coupon.minPurchaseAmount) {
        const msg = `Minimum purchase of ₹${coupon.minPurchaseAmount} required for this coupon`;
        setCouponError(msg);
        toast.error(msg);
        return;
      }

      // Update Store (Effect will update local state)
      setStoreCoupon({
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        minPurchaseAmount: coupon.minPurchaseAmount
      });

      setCouponCode('');
      toast.success('Coupon applied successfully!');

    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeStoreCoupon();
    toast.info('Coupon removed');
  };


  const validateAddress = () => {
    const { firstName, lastName, address, city, state, zipCode, phone, email } = formData;

    if (!firstName.trim() || !lastName.trim() || !address.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !phone.trim() || !email.trim()) {
      toast.error("Please fill in all address details");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (phone.length < 10 || !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }

    if (zipCode.length < 6 || !/^\d{6}$/.test(zipCode)) {
      toast.error("Please enter a valid 6-digit PIN code");
      return false;
    }

    return true;
  };

  const handleStepChange = (step: Step) => {
    if (step === 'payment' || step === 'review') {
      // If we are currently at address step, validate it
      if (currentStep === 'address' && !validateAddress()) {
        return;
      }
      // If we jump from random step to payment/review, ensure valid data (optional but safer)
      if (!formData.firstName) {
        // If somehow formData is empty (e.g. dev tools), block
        if (!validateAddress()) return;
      }
    }
    setCurrentStep(step);
  };

  // Initialize Recaptcha when entering verification step
  useEffect(() => {
    if (currentStep === 'verification' && !window.recaptchaVerifier) {
      // Ensure DOM is ready
      const initRecaptcha = async () => {
        try {
          if (!document.getElementById('recaptcha-container')) {
            console.error("Recaptcha container not found");
            return;
          }
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            },
          });
          // Auto-send OTP once recaptcha is ready
          await sendOtp();
        } catch (err) {
          console.error("Recaptcha init error:", err);
          setAuthError("Failed to initialize security check. Please refresh.");
        }
      };

      // Small delay to allow React to render the container
      setTimeout(initRecaptcha, 100);
    }
  }, [currentStep]);

  const setupRecaptcha = () => {
    // Kept for manual retry if needed, but useEffect handles primary init
    if (!window.recaptchaVerifier && document.getElementById('recaptcha-container')) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (isAuthenticated) {
      await initiatePayment(user!.id);
    } else {
      // Start Phone Verification - logical flow triggers useEffect
      setCurrentStep('verification');
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    setAuthError('');
    try {
      const formattedPhone = formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;

      if (!window.recaptchaVerifier) {
        setupRecaptcha(); // Try one last time
        if (!window.recaptchaVerifier) throw new Error("Recaptcha not initialized");
      }

      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      toast.success("OTP sent successfully!");

    } catch (err: any) {
      console.error('Error sending OTP:', err);
      // Reset recaptcha if it fails, so it can be re-rendered
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch (clearErr) { console.error("Failed to clear recaptcha", clearErr); }
      }
      setAuthError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setAuthError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(otp);
        const firebaseUser = result.user;

        // Check if user exists in Firestore, if not create
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: firebaseUser.uid,
            email: formData.email,
            displayName: `${formData.firstName} ${formData.lastName}`,
            phone: firebaseUser.phoneNumber,
            role: 'user',
            createdAt: serverTimestamp(),
          });
        }

        // Update local store
        setUser({
          id: firebaseUser.uid,
          email: formData.email,
          username: firebaseUser.phoneNumber || '',
          displayName: `${formData.firstName} ${formData.lastName}`,
          phone: firebaseUser.phoneNumber || '',
          createdAt: new Date().toISOString(),
          role: 'user'
        });

        // Initiate Payment
        await initiatePayment(firebaseUser.uid);
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setAuthError('Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const initiatePayment = async (userId: string) => {
    setLoading(true);
    try {
      let orderId = '';

      await runTransaction(db, async (transaction) => {
        // 1. READS: Check stock for all items FIRST
        const bookReads: { ref: any, item: typeof items[0] }[] = [];
        for (const item of items) {
          const bookRef = doc(db, 'books', item.bookId);
          bookReads.push({ ref: bookRef, item });
        }

        const bookDocs = await Promise.all(bookReads.map(b => transaction.get(b.ref)));

        // Validate all stocks
        bookDocs.forEach((bookDoc, index) => {
          const { item } = bookReads[index];
          if (!bookDoc.exists()) {
            throw new Error(`Book "${item.title}" not found`);
          }
          const bookData = bookDoc.data() as any;
          // bookData is typed as DocumentData, we need safe access
          const currentStock = bookData?.stockQuantity ?? bookData?.stock ?? 0;

          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for "${item.title}". Available: ${currentStock}`);
          }
        });

        // 2. WRITES: All updates and creations

        // Update stock
        bookDocs.forEach((bookDoc, index) => {
          const { ref, item } = bookReads[index];
          const bookData = bookDoc.data() as any;
          const currentStock = bookData?.stockQuantity ?? bookData?.stock ?? 0;

          transaction.update(ref, {
            stockQuantity: currentStock - item.quantity
          });
        });

        // Create Order
        const newOrderRef = doc(collection(db, 'orders'));
        orderId = generateOrderId();
        transaction.set(newOrderRef, {
          orderId,
          userId,
          items,
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
          paymentMethod: 'PHONEPE',
          subtotal,
          shippingCharges,
          discount,
          appliedCoupon: appliedCoupon ? appliedCoupon.code : null, // Store used coupon
          totalAmount: total,
          status: 'pending_payment',
          paymentStatus: 'pending',
          createdAt: serverTimestamp(),
        });

        // Update User Profile
        const userRef = doc(db, 'users', userId);
        transaction.set(userRef, {
          email: formData.email,
          phone: formData.phone,
          displayName: `${formData.firstName} ${formData.lastName}`,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: 'India'
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      });

      // 3. Call Payment API
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          orderId: orderId,
          mobileNumber: formData.phone.replace(/\D/g, '') // Send clean digits to backend
        })
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to PhonePe
        if (typeof window !== 'undefined') {
          window.location.href = data.url;
        }
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }

    } catch (error: any) {
      console.error("Error initiating payment:", error);
      alert(error.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 w-full py-16 pt-24">
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24">
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
                      onClick={() => currentStep !== 'verification' && handleStepChange(step)}
                      disabled={currentStep === 'verification'}
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep === step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                        }`}
                    >
                      {index + 1}
                    </button>
                    {index < 2 && (
                      <div className={`w-16 h-1 mx-2 ${currentStep !== 'address' ? 'bg-primary' : 'bg-secondary'
                        }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Verification Step */}
              {currentStep === 'verification' && (
                <Card className="p-6 space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Verify Phone Number</h2>
                    <p className="text-muted-foreground">
                      We sent an OTP to {formData.phone}. Please enter it below to complete your order.
                    </p>
                  </div>

                  {authError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                      {authError}
                    </div>
                  )}

                  <div className="max-w-xs mx-auto space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        className="pl-10 text-center tracking-widest text-lg"
                        value={otp}
                        maxLength={6}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div id="recaptcha-container"></div>
                    <Button
                      className="w-full"
                      onClick={verifyOtp}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Verify & Pay
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setCurrentStep('review')}
                      disabled={loading}
                    >
                      Back
                    </Button>
                  </div>
                </Card>
              )}

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

                    <Popover open={openState} onOpenChange={setOpenState}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openState}
                          className="justify-between"
                        >
                          {formData.state
                            ? formData.state
                            : "Select State..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 h-[200px] overflow-y-auto">
                        <Command>
                          <CommandInput placeholder="Search state..." />
                          <CommandList>
                            <CommandEmpty>No state found.</CommandEmpty>
                            <CommandGroup>
                              {INDIAN_STATES.map((state) => (
                                <CommandItem
                                  key={state}
                                  value={state}
                                  onSelect={(currentValue) => {
                                    setFormData(prev => ({ ...prev, state: currentValue }));
                                    setOpenState(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.state === state ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {state}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 flex items-center justify-between bg-secondary/20">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-semibold">PhonePe Secure Payment</p>
                          <p className="text-sm text-muted-foreground">UPI, Cards, NetBanking, Wallets</p>
                        </div>
                      </div>
                      <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
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
                      {formData.firstName} {formData.lastName}<br />
                      {formData.address}<br />
                      {formData.city}, {formData.state} {formData.zipCode}
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

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Cancellation Policy</p>
                    <p>Orders can only be cancelled within 24 hours of placement. After that, cancellation is not possible.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => handleStepChange('payment')}>
                      Back
                    </Button>
                    <Button onClick={handlePlaceOrder} size="lg" disabled={loading} className="bg-[#5f259f] hover:bg-[#4a1d7c]">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Pay ₹{total.toLocaleString()} with PhonePe
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

                {/* Coupon Code Section */}
                <div className="pb-6 border-b">
                  <h3 className="font-semibold mb-3 text-sm">Discount Code</h3>
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
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="h-9"
                      />
                      <Button size="sm" onClick={handleApplyCoupon} disabled={couponLoading}>
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping {shippingDetails && `(${shippingDetails.weightUsed}kg - Zone ${shippingDetails.zone})`}</span>
                    <span>₹{shippingCharges}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Delivery charges are dynamic based on your delivery location.
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount {appliedCoupon && `(${appliedCoupon.code})`}</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
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

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
