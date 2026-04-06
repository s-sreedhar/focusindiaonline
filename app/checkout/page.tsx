'use client';

import { useState, useEffect } from 'react';
import { createNotification } from '@/lib/services/notifications';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { ChevronDown, Loader2, Phone, Lock, ShieldCheck, X, ArrowLeft, CreditCard, ShoppingBag, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { generateOrderId } from '@/lib/utils/order-id';
import { calculateShippingCharges, INDIAN_STATES } from '@/lib/utils/shipping';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    doorNo: '',
    street: '',
    villageTown: '',
    mandal: '',
    district: '',
    city: '',
    state: '',
    pinCode: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const subtotal = getTotalPrice();

  // Calculate total weight and shipping
  // Test Series type should have weight 0 or be excluded.
  const totalWeight = items.reduce((sum, item) => {
    // If it's a test series, weight should be 0.
    if (item.type === 'test_series') return sum;
    const weight = (item as any).weight || 500;
    return sum + (weight * item.quantity);
  }, 0);

  const [shippingDetails, setShippingDetails] = useState<{ charges: number, zone: string, weightUsed: number } | null>(null);
  const [costPerKg, setCostPerKg] = useState<number>(40);
  const [shippingSettingsLoaded, setShippingSettingsLoaded] = useState(false);

  useEffect(() => {
    async function fetchShippingSettings() {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedCost = Number(data.shippingCostPerKg) || 40;
          setCostPerKg(fetchedCost);
        }
      } catch (error) {
        console.error('Error fetching shipping settings:', error);
      } finally {
        setShippingSettingsLoaded(true);
      }
    }
    fetchShippingSettings();
  }, []);

  const shippingCharges = shippingDetails ? shippingDetails.charges : 0;

  const hasDigitalItems = items.some(item => item.type === 'test_series');

  useEffect(() => {
    // Wait for settings to load before calculating
    if (!shippingSettingsLoaded) return;
    
    const weightKg = totalWeight / 1000;

    if (totalWeight > 0 && formData.state) {
      const details = calculateShippingCharges(totalWeight, formData.state, costPerKg);
      setShippingDetails(details);
    } else {
      // Still show the actual weight used, but charges set to 0 (TBD in UI)
      setShippingDetails({ charges: 0, zone: 'A', weightUsed: weightKg });
    }
  }, [formData.state, totalWeight, costPerKg, shippingSettingsLoaded]);

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
    // Clear error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
      //console.error('Error applying coupon:', error);
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
    const { firstName, lastName, doorNo, street, villageTown, mandal, district, city, state, pinCode, phone, email } = formData;
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (cleanPhone.length !== 10) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!doorNo.trim()) errors.doorNo = "Door No is required";
    if (!street.trim()) errors.street = "Street/Area is required";
    if (!villageTown.trim()) errors.villageTown = "Village/Town is required";
    if (!mandal.trim()) errors.mandal = "Mandal is required";
    if (!district.trim()) errors.district = "District is required";
    if (!city.trim()) errors.city = "City is required";
    if (!state.trim()) errors.state = "State is required";

    if (!pinCode.trim()) {
      errors.pinCode = "PIN code is required";
    } else if (!/^\d{6}$/.test(pinCode)) {
      errors.pinCode = "Please enter a valid 6-digit PIN code";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
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

  /*
  // Initialize Recaptcha when entering verification step
  useEffect(() => {
    if (currentStep === 'verification' && !window.recaptchaVerifier) {
      // Ensure DOM is ready
      const initRecaptcha = async () => {
        try {
          if (!document.getElementById('recaptcha-container')) {
            //console.error("Recaptcha container not found");
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
          //console.error("Recaptcha init error:", err);
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
  */



  /*
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
      //console.error('Error sending OTP:', err);
      // Reset recaptcha if it fails, so it can be re-rendered
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch (clearErr) { //console.error("Failed to clear recaptcha", clearErr); }
      }
      setAuthError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  */

  // Modified handlePlaceOrder to bypass OTP
  const handlePlaceOrder = async () => {
    if (isAuthenticated && user?.id) {
      await initiatePayment(user.id);
    } else {
      // COMMENTED OUT OTP VERIFICATION FLOW
      /*
      // Start Phone Verification - logical flow triggers useEffect
      setCurrentStep('verification');
      */

      // Guest checkout for physical items only

      if (hasDigitalItems) {
        toast.error("Please login to purchase Test Series / Digital Items.");
        return;
      }

      // Validate before proceeding
      if (!validateAddress()) {
        return;
      }

      // Generate a guest ID
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Update local auth state first (custom: avoids Firebase listener clearing session mid-checkout)
      // The actual Firestore user doc is created server-side in /api/orders/create using Admin SDK
      setUser({
        id: guestId,
        email: formData.email,
        username: formData.phone,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
        role: 'guest',
        authMethod: 'custom',
      });

      // Proceed to payment - server will create guest user doc via Admin SDK
      // initiatePayment has its own try-catch and error handling
      await initiatePayment(guestId);
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
      //console.error('Error verifying OTP:', err);
      setAuthError('Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Create Order via Secure Backend API
      const createOrderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: items,
          shippingAddress: {
            fullName: `${formData.firstName} ${formData.lastName}`,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: formData.phone.replace(/\D/g, '').slice(-10),
            doorNo: formData.doorNo,
            street: formData.street,
            villageTown: formData.villageTown,
            mandal: formData.mandal,
            district: formData.district,
            city: formData.city,
            state: formData.state,
            pinCode: formData.pinCode,
          },
          subtotal,
          shippingCharges,
          discount,
          appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
          totalAmount: total,
          userProfile: {
            email: formData.email,
            phone: formData.phone.replace(/\D/g, '').slice(-10),
            displayName: `${formData.firstName} ${formData.lastName}`,
            address: {
              doorNo: formData.doorNo,
              street: formData.street,
              villageTown: formData.villageTown,
              mandal: formData.mandal,
              district: formData.district,
              city: formData.city,
              state: formData.state,
              pinCode: formData.pinCode,
              country: 'India'
            }
          },
          isGuest: userId.startsWith('guest_'),
        })
      });

      const orderData = await createOrderResponse.json();

      if (!createOrderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const { orderId } = orderData;

      // NOTIFY: Potential Lead (non-blocking, don't await - client Firestore may fail for guests)
      createNotification(
        'potential_lead',
        'Potential Lead (Payment Pending)',
        `Order #${orderId} initiated by ${formData.firstName} ${formData.lastName} for ₹${total}.`,
        orderId
      ).catch(() => {});

      // 2. Load Razorpay Script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      // 3. Call Payment API to create Razorpay Order
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          orderId: orderId,
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      // 4. Open Razorpay Checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Focus India Online',
        description: `Order #${orderId}`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
          // Success callback - Razorpay payment completed
          // The webhook will handle updating the order status
          toast.success('Payment successful! Redirecting...');
          clearCart();
          router.push(`/checkout/success?orderId=${orderId}`);
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          orderId: orderId,
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment cancelled. Your order has been saved and you can retry payment.');
            setLoading(false);
          },
          escape: true,
          backdropclose: false,
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      // Handle payment failures
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description || 'Please try again'}`);
        setLoading(false);
      });

      rzp.open();

    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="max-w-md w-full"
          >
            <Card className="p-12 text-center space-y-8 border-none shadow-2xl shadow-blue-100/50 rounded-3xl bg-white">
              <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto animate-bounce-slow">
                <ShoppingBag className="w-12 h-12" />
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-black tracking-tight text-gray-900">Your cart is empty</h1>
                <p className="text-gray-500 text-lg">Looks like you haven't added anything to your cart yet. Let's find some great books for you!</p>
              </div>
              <Button asChild size="lg" className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-blue-200">
                <Link href="/shop">Explore Collection</Link>
              </Button>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const steps = [
    { id: 'address', label: 'Shipping', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: Check },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      <Header />

      <main className="flex-1 pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-slate-900">Checkout</h1>
              <p className="text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Secure Checkout Powered by Razorpay
              </p>
            </div>

            {/* Modern Stepper */}
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-slate-100 hidden sm:flex items-center gap-1">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => currentStep !== 'verification' && handleStepChange(step.id)}
                    disabled={currentStep === 'verification'}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300",
                      currentStep === step.id 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
                        currentStep === step.id ? "bg-white/20" : "bg-slate-100"
                    )}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-bold">{step.label}</span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className="w-4 h-[1px] bg-slate-200 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Main Form Content */}
            <div className="lg:col-span-8 space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Verification Step */}
                  {currentStep === 'verification' && (
                    <Card className="p-8 md:p-12 border-none shadow-2xl shadow-slate-200/50 rounded-3xl bg-white space-y-8">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 leading-none">Security Check</h2>
                            <p className="text-slate-500 max-w-sm mx-auto">
                            We've sent a 6-digit code to <span className="font-bold text-slate-900">{formData.phone}</span>
                            </p>
                        </div>
                      </div>

                      {authError && (
                        <motion.div 
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 text-center"
                        >
                          {authError}
                        </motion.div>
                      )}

                      <div className="max-w-xs mx-auto space-y-6">
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="0 0 0 0 0 0"
                            className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all pl-6"
                            value={otp}
                            maxLength={6}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                        <div id="recaptcha-container" className="flex justify-center"></div>
                        <Button
                          className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-blue-200"
                          onClick={verifyOtp}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Place Order"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-900"
                          onClick={() => setCurrentStep('review')}
                          disabled={loading}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Change Details
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Address Step */}
                  {currentStep === 'address' && (
                    <Card className="p-8 md:p-10 border-none shadow-2xl shadow-slate-200/50 rounded-3xl bg-white space-y-8">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-6 transition-all">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-none">Shipping Details</h2>
                            <p className="text-slate-500 mt-1">Where should we deliver your books?</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">First Name</label>
                            <Input
                                placeholder="e.g. John"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.firstName && "border-red-500")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Last Name</label>
                            <Input
                                placeholder="e.g. Doe"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.lastName && "border-red-500")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                            <Input
                                placeholder="john@example.com"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.email && "border-red-500")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                            <Input
                                placeholder="10-digit mobile number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.phone && "border-red-500")}
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                             <Separator className="my-2" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Door / Flat No</label>
                            <Input
                                placeholder="Room/Door No"
                                name="doorNo"
                                value={formData.doorNo}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.doorNo && "border-red-500")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Street / Area</label>
                            <Input
                                placeholder="Main road, landmark..."
                                name="street"
                                value={formData.street}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.street && "border-red-500")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Village / Town</label>
                            <Input
                                placeholder="Town name"
                                name="villageTown"
                                value={formData.villageTown}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.villageTown && "border-red-500")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mandal</label>
                            <Input
                                placeholder="Mandal name"
                                name="mandal"
                                value={formData.mandal}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.mandal && "border-red-500")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">District</label>
                            <Input
                                placeholder="District name"
                                name="district"
                                value={formData.district}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.district && "border-red-500")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">City</label>
                            <Input
                                placeholder="City name"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.city && "border-red-500")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">State</label>
                            <Popover open={openState} onOpenChange={setOpenState}>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={fieldErrors.state ? "destructive" : "outline"}
                                    role="combobox"
                                    aria-expanded={openState}
                                    className={cn("h-13 w-full justify-between rounded-xl", fieldErrors.state && "border-red-500 text-red-500")}
                                    >
                                    {formData.state ? formData.state : "Select State"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[300px] overflow-hidden rounded-2xl shadow-2xl border-slate-100">
                                    <Command>
                                        <CommandInput placeholder="Search state..." className="h-12 border-none focus:ring-0" />
                                        <CommandList className="max-h-[240px] overflow-y-auto">
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
                                                className="h-10 px-4 aria-selected:bg-blue-50 aria-selected:text-blue-700 pointer-events-auto"
                                                >
                                                <Check className={cn("mr-2 h-4 w-4", formData.state === state ? "opacity-100 text-blue-600" : "opacity-0")} />
                                                {state}
                                                </CommandItem>
                                            ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">PIN Code</label>
                            <Input
                                placeholder="6-digit code"
                                name="pinCode"
                                value={formData.pinCode}
                                onChange={handleInputChange}
                                className={cn("h-13 rounded-xl", fieldErrors.pinCode && "border-red-500")}
                            />
                        </div>
                      </div>
                      
                      <Button 
                         size="lg" 
                         className="w-full h-15 text-lg font-bold rounded-2xl shadow-xl shadow-blue-200 transition-transform active:scale-95" 
                         onClick={() => handleStepChange('payment')}
                      >
                        Continue to Payment
                      </Button>
                    </Card>
                  )}

                  {/* Payment Step */}
                  {currentStep === 'payment' && (
                    <Card className="p-8 md:p-10 border-none shadow-2xl shadow-slate-200/50 rounded-3xl bg-white space-y-8">
                       <div className="flex items-center gap-4 border-b border-slate-100 pb-6 transition-all">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-none">Payment Method</h2>
                            <p className="text-slate-500 mt-1">Select how you'd like to pay</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="group relative border-2 border-blue-500 bg-blue-50/50 p-6 rounded-3xl flex items-center justify-between cursor-pointer transition-all hover:bg-blue-50">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
                                <ShieldCheck className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-extrabold text-slate-900 text-lg">Razorpay Secure</p>
                                <p className="text-sm text-slate-500">Fast & Secure: UPI, Cards, NetBanking</p>
                            </div>
                          </div>
                          <div className="h-6 w-6 rounded-full border-[3px] border-blue-600 bg-blue-600 flex items-center justify-center">
                               <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">End-to-End Encrypted Transaction</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="h-14 rounded-2xl border-slate-200" 
                            onClick={() => handleStepChange('address')}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Address
                        </Button>
                        <Button 
                            size="lg" 
                            className="h-14 text-lg font-bold rounded-2xl shadow-xl shadow-blue-200" 
                            onClick={() => handleStepChange('review')}
                        >
                           Preview Order
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Review Step */}
                  {currentStep === 'review' && (
                    <Card className="p-8 md:p-10 border-none shadow-2xl shadow-slate-200/50 rounded-3xl bg-white space-y-8">
                       <div className="flex items-center gap-4 border-b border-slate-100 pb-6 transition-all">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-none">Review Order</h2>
                            <p className="text-slate-500 mt-1">One last check before we ship!</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-50/50 p-6 rounded-3xl space-y-4 border border-white">
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-500" /> Shipping To
                            </h3>
                            <div className="text-slate-600 text-[15px] leading-relaxed">
                                <p className="font-bold text-slate-900 text-lg mb-1">{formData.firstName} {formData.lastName}</p>
                                <p>{formData.doorNo}, {formData.street}</p>
                                <p>{formData.villageTown}, {formData.mandal}</p>
                                <p>{formData.district}, {formData.city}</p>
                                <p>{formData.state} {formData.pinCode}</p>
                                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                                    <Phone className="w-3.5 h-3.5" /> +91 {formData.phone}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-blue-800">
                                <h4 className="font-bold flex items-center gap-2 text-sm mb-1">
                                    <ShieldCheck className="w-4 h-4" /> Estimated Delivery
                                </h4>
                                <p className="text-sm opacity-80">Your items will reach you within 3–5 working days.</p>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-amber-800">
                                <h4 className="font-bold flex items-center gap-2 text-sm mb-1">Cancellation Policy</h4>
                                <p className="text-xs opacity-80 leading-relaxed">Orders can only be cancelled within 24 hours of placement. No cancellations thereafter.</p>
                            </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="h-15 rounded-2xl border-slate-200" 
                            onClick={() => handleStepChange('payment')}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payment
                        </Button>
                        <Button 
                            onClick={handlePlaceOrder} 
                            size="lg" 
                            disabled={loading} 
                            className="h-15 text-lg font-black rounded-2xl shadow-xl shadow-blue-200 bg-blue-600 hover:bg-blue-700 transition-all active:scale-95 group"
                        >
                          {loading ? (
                             <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                          ) : (
                             <>
                                Pay ₹{total.toLocaleString()}
                                <ChevronDown className="w-5 h-5 ml-2 -rotate-90 group-hover:translate-x-1 transition-transform" />
                             </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-24 space-y-6">
                  <Card className="p-8 border-none shadow-2xl shadow-slate-200/40 rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-16 -mt-16 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 -ml-16 -mb-16 rounded-full blur-3xl opacity-50" />
                    
                    <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        Order Summary
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 rounded-lg py-1 px-3 border-none">
                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                        </Badge>
                    </h2>

                    <div className="max-h-[30vh] overflow-y-auto space-y-6 pr-2 mb-8 -mx-2 px-2 custom-scrollbar">
                      {items.map((item) => (
                        <div key={item.bookId} className="flex gap-4 items-start group">
                            <div className="w-16 h-20 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500 font-medium">Qty: {item.quantity}</p>
                                    <p className="text-sm font-black text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="mb-8 opacity-50" />

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Input
                                placeholder="Coupon Code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                className="h-11 rounded-xl bg-slate-50 border-none placeholder:text-slate-400"
                            />
                            <Button 
                                onClick={handleApplyCoupon} 
                                disabled={couponLoading || appliedCoupon !== null}
                                variant={appliedCoupon ? "outline" : "default"}
                                className="h-11 rounded-xl px-6"
                            >
                                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : appliedCoupon ? "Applied" : "Apply"}
                            </Button>
                        </div>
                        {appliedCoupon && (
                            <motion.div 
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               className="bg-green-50 text-green-700 px-4 py-3 rounded-xl flex items-center justify-between group border border-green-100"
                            >
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-green-600 text-white border-none rounded-lg font-black">{appliedCoupon.code}</Badge>
                                    <span className="text-xs font-bold">{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`}</span>
                                </div>
                                <X 
                                   className="w-4 h-4 cursor-pointer hover:text-red-500 transition-colors" 
                                   onClick={handleRemoveCoupon} 
                                />
                            </motion.div>
                        )}
                        {couponError && <p className="text-red-500 text-xs font-medium ml-1">{couponError}</p>}
                      </div>

                      <div className="space-y-4 pt-4">
                        <div className="flex justify-between text-[15px] font-medium text-slate-500">
                            <span>Subtotal</span>
                            <span className="text-slate-900 font-bold">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[15px] font-medium text-slate-500">
                            <span className="flex items-center gap-2">Shipping <Badge variant="outline" className="text-[10px] py-0">{shippingDetails?.weightUsed.toFixed(2)}kg</Badge></span>
                            {shippingCharges > 0 ? (
                                <span className="text-slate-900 font-bold">₹{shippingCharges}</span>
                            ) : (
                                <span className="text-amber-500 text-xs italic font-bold">Select State</span>
                            )}
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-[15px] font-medium text-green-600">
                                <span>Discount</span>
                                <span className="font-black">-₹{discount.toLocaleString()}</span>
                            </div>
                        )}
                        
                        <Separator className="opacity-50" />
                        
                        <div className="flex justify-between items-center pt-2">
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total to Pay</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">₹{total.toLocaleString()}</p>
                            </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-none shadow-xl shadow-slate-200/30 rounded-3xl bg-white space-y-4">
                    <div className="flex items-center gap-4 text-slate-500">
                        <ShieldCheck className="w-6 h-6 text-green-500" />
                        <div className="space-y-0.5">
                            <p className="text-sm font-black text-slate-900">Protected Payment</p>
                            <p className="text-xs">Your personal data is encrypted and secure.</p>
                        </div>
                    </div>
                  </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Summary Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-6 transition-all">
          <div className="max-w-md mx-auto">
              <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="bg-white/90 backdrop-blur-xl border border-slate-100 shadow-[0_-8px_40px_-10px_rgba(0,0,0,0.15)] rounded-3xl p-4 flex items-center justify-between gap-4"
              >
                  <div 
                     className="flex-1 cursor-pointer group"
                     onClick={() => setShowMobileSummary(!showMobileSummary)}
                  >
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showMobileSummary && "rotate-180")} />
                      </div>
                      <p className="text-2xl font-black text-slate-900">₹{total.toLocaleString()}</p>
                  </div>
                  
                  {currentStep === 'verification' ? (
                       <Button 
                          onClick={verifyOtp} 
                          disabled={loading}
                          className="h-14 rounded-2xl px-8 font-black shadow-lg shadow-blue-200"
                       >
                           {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify Code"}
                       </Button>
                  ) : currentStep === 'review' ? (
                       <Button 
                          onClick={handlePlaceOrder} 
                          disabled={loading}
                          className="h-14 rounded-2xl px-10 font-black shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all outline-none ring-0 border-none"
                       >
                           {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Pay Now"}
                       </Button>
                  ) : (
                       <Button 
                          onClick={() => handleStepChange(currentStep === 'address' ? 'payment' : 'review')} 
                          className="h-14 rounded-2xl px-8 font-black shadow-lg shadow-blue-200 transition-all outline-none ring-0 border-none"
                       >
                           Next Step
                       </Button>
                  )}
              </motion.div>
          </div>
      </div>

      {/* Mobile Summary Drawer */}
      <AnimatePresence>
        {showMobileSummary && (
            <>
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   onClick={() => setShowMobileSummary(false)}
                   className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden"
                />
                <motion.div 
                   initial={{ y: '100%' }}
                   animate={{ y: 0 }}
                   exit={{ y: '100%' }}
                   transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                   className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-[40px] z-[60] lg:hidden overflow-hidden flex flex-col pt-2"
                >
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />
                    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-2 custom-scrollbar">
                         <h2 className="text-2xl font-black text-slate-900 mb-8">Order Details</h2>
                         
                         <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.bookId} className="flex gap-5 items-center">
                                    <div className="w-16 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-50">
                                        {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="font-bold text-slate-900 line-clamp-2 leading-tight">{item.title}</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-slate-400">Qty: {item.quantity}</p>
                                            <p className="font-black text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                         </div>

                         <Separator className="my-8 opacity-50" />

                         <div className="space-y-5">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Apply Coupon</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ex: FOCUS20"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="h-13 rounded-2xl bg-slate-50 border-none font-bold"
                                    />
                                    <Button onClick={handleApplyCoupon} size="lg" className="h-13 rounded-2xl px-6">Apply</Button>
                                </div>
                                {appliedCoupon && (
                                    <div className="bg-green-50 p-4 rounded-2xl flex items-center justify-between border border-green-100">
                                         <p className="font-bold text-green-700">{appliedCoupon.code} applied!</p>
                                         <X className="w-5 h-5 text-green-700 opacity-50" onClick={handleRemoveCoupon} />
                                    </div>
                                )}
                            </div>

                            <Separator className="my-2 opacity-50" />

                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between text-slate-500 font-bold">
                                    <span>Subtotal</span>
                                    <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 font-bold">
                                    <span>Shipping</span>
                                    {shippingCharges > 0 ? (
                                        <span className="text-slate-900">₹{shippingCharges}</span>
                                    ) : (
                                        <span className="text-amber-500 italic text-sm">Select State</span>
                                    )}
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600 font-bold">
                                        <span>Discount</span>
                                        <span className="font-black">-₹{discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-2">
                                    <span className="text-lg font-black text-slate-900 uppercase tracking-tight">Total</span>
                                    <span className="text-3xl font-black text-blue-600">₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                         </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}


declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
