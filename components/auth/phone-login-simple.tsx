'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Phone, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function PhoneLoginSimple() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState('');
    const router = useRouter();
    const { setUser } = useAuthStore();

    useEffect(() => {
        // Initialize reCAPTCHA verifier
        if (!window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {
                        // console.log('[PhoneLogin] reCAPTCHA solved');
                    },
                    'expired-callback': () => {
                        // console.log('[PhoneLogin] reCAPTCHA expired');
                        setError('reCAPTCHA expired. Please try again.');
                    }
                });
            } catch (err) {
                //console.error('[PhoneLogin] Error initializing reCAPTCHA:', err);
            }
        }

        return () => {
            // Cleanup on unmount
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = undefined;
            }
        };
    }, []);

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = `+91${phoneNumber}`;
            // console.log('[PhoneLogin] Sending OTP to:', formattedPhone);

            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

            // console.log('[PhoneLogin] OTP sent successfully');
            setConfirmationResult(confirmation);
            setStep('otp');
        } catch (err: any) {
            //console.error('[PhoneLogin] Error sending OTP:', err);

            if (err.code === 'auth/invalid-phone-number') {
                setError('Invalid phone number format');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else if (err.code === 'auth/quota-exceeded') {
                setError('SMS quota exceeded. Please contact support.');
            } else {
                setError(err.message || 'Failed to send OTP. Please try again.');
            }

            // Reset reCAPTCHA on error
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = undefined;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!confirmationResult) {
                setError('Session expired. Please try again.');
                setStep('phone');
                return;
            }

            // console.log('[PhoneLogin] Verifying OTP...');
            const result = await confirmationResult.confirm(otp);
            const firebaseUser = result.user;

            // console.log('[PhoneLogin] OTP verified, fetching user data...');

            // Fetch user data from Firestore
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                // console.log('[PhoneLogin] User data loaded, role:', userData.role);

                setUser({
                    id: firebaseUser.uid,
                    email: userData.email || '',
                    username: userData.phone || firebaseUser.phoneNumber || '',
                    displayName: userData.displayName || 'User',
                    phone: userData.phone || firebaseUser.phoneNumber || '',
                    createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    role: userData.role || 'customer',
                });

                // Redirect based on role
                if (userData.role === 'superadmin') {
                    // console.log('[PhoneLogin] Redirecting to admin panel');
                    router.push('/admin');
                } else {
                    // console.log('[PhoneLogin] Redirecting to home');
                    router.push('/');
                }
            } else {
                // User doesn't exist - redirect to registration
                // console.log('[PhoneLogin] User not found, redirecting to registration');
                setError('Account not found. Please register first.');
                setTimeout(() => {
                    router.push('/register');
                }, 2000);
            }
        } catch (err: any) {
            //console.error('[PhoneLogin] Error verifying OTP:', err);

            if (err.code === 'auth/invalid-verification-code') {
                setError('Invalid OTP. Please check and try again.');
            } else if (err.code === 'auth/code-expired') {
                setError('OTP expired. Please request a new one.');
                setStep('phone');
            } else {
                setError(err.message || 'Failed to verify OTP. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setOtp('');
        setStep('phone');
        setConfirmationResult(null);

        // Reset reCAPTCHA
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = undefined;
        }
    };

    return (
        <Card className="p-8 w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">
                    {step === 'phone'
                        ? 'Enter your mobile number to continue'
                        : 'Enter the OTP sent to your mobile'}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {step === 'phone' ? (
                    <>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="tel"
                                placeholder="Mobile Number (10 digits)"
                                className="pl-10"
                                value={phoneNumber}
                                maxLength={10}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                disabled={loading}
                            />
                        </div>
                        <div id="recaptcha-container"></div>
                        <Button
                            className="w-full"
                            onClick={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send OTP
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-primary hover:underline">
                                Register
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm mb-4">
                            OTP sent to +91{phoneNumber}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                className="pl-10 text-center text-lg tracking-widest"
                                value={otp}
                                maxLength={6}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Verify OTP
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={handleResendOtp}
                            disabled={loading}
                        >
                            Change Phone Number
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
}

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
