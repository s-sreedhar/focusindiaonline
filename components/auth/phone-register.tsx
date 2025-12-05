'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Phone, Lock, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { handleFirebaseError } from '@/lib/error-utils';

export function PhoneRegister() {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(15);
    const [canResend, setCanResend] = useState(false);
    const router = useRouter();
    const { setUser } = useAuthStore();

    useEffect(() => {
        // Initialize reCAPTCHA verifier
        const initRecaptcha = () => {
            // Check if container exists and clear it if it has content
            const container = document.getElementById('recaptcha-container');
            if (container) {
                container.innerHTML = '';
            }

            if (!window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                        size: 'invisible',
                        callback: () => {
                            console.log('[PhoneRegister] reCAPTCHA solved');
                        },
                        'expired-callback': () => {
                            console.log('[PhoneRegister] reCAPTCHA expired');
                            setError('reCAPTCHA expired. Please try again.');
                            if (window.recaptchaVerifier) {
                                window.recaptchaVerifier.clear();
                                window.recaptchaVerifier = undefined;
                            }
                        }
                    });
                } catch (err) {
                    console.error('[PhoneRegister] Error initializing reCAPTCHA:', err);
                }
            }
        };

        initRecaptcha();

        return () => {
            // Cleanup on unmount
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.error('Error clearing recaptcha:', e);
                }
                window.recaptchaVerifier = undefined;
            }
            const container = document.getElementById('recaptcha-container');
            if (container) {
                container.innerHTML = '';
            }
        };
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'otp' && timeLeft > 0 && !canResend) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft, canResend]);

    const handleSendOtp = async () => {
        // Validation
        if (!name || name.trim().length < 2) {
            setError('Please enter your full name (at least 2 characters)');
            return;
        }

        if (!phoneNumber || phoneNumber.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            console.log('[PhoneRegister] Sending OTP to:', formattedPhone);

            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

            console.log('[PhoneRegister] OTP sent successfully');
            setConfirmationResult(confirmation);
            setStep('otp');
            setTimeLeft(15);
            setCanResend(false);
        } catch (err: any) {
            console.error('[PhoneRegister] Error sending OTP:', err);
            const message = handleFirebaseError(err);
            setError(message);

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
                setStep('details');
                return;
            }

            console.log('[PhoneRegister] Verifying OTP...');
            const result = await confirmationResult.confirm(otp);
            const firebaseUser = result.user;

            console.log('[PhoneRegister] OTP verified, creating user document...');

            // Create user document in Firestore
            const userDocRef = doc(db, 'users', firebaseUser.uid);

            try {
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // User already exists (shouldn't happen in registration, but handle it)
                    console.log('[PhoneRegister] User already exists');
                    const userData = userDoc.data();

                    setUser({
                        id: firebaseUser.uid,
                        email: userData.email || '',
                        username: userData.phone || firebaseUser.phoneNumber || '',
                        displayName: userData.displayName || name,
                        phone: userData.phone || firebaseUser.phoneNumber || '',
                        createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        role: userData.role || 'customer',
                    });
                } else {
                    // Create new user document
                    const newUserData = {
                        uid: firebaseUser.uid,
                        displayName: name.trim(),
                        phone: firebaseUser.phoneNumber,
                        email: '', // No email for phone registration
                        role: 'customer',
                        createdAt: serverTimestamp(),
                    };

                    await setDoc(userDocRef, newUserData);
                    console.log('[PhoneRegister] User document created successfully');

                    setUser({
                        id: firebaseUser.uid,
                        email: '',
                        username: firebaseUser.phoneNumber || '',
                        displayName: name.trim(),
                        phone: firebaseUser.phoneNumber || '',
                        createdAt: new Date().toISOString(),
                        role: 'customer',
                    });
                }

                console.log('[PhoneRegister] Registration complete, redirecting...');
                router.push('/');
            } catch (firestoreErr: any) {
                const message = handleFirebaseError(firestoreErr);
                setError(message);
            }
        } catch (err: any) {
            console.error('[PhoneRegister] Error verifying OTP:', err);
            const message = handleFirebaseError(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;

        setLoading(true);
        setError('');

        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setTimeLeft(15);
            setCanResend(false);
        } catch (err: any) {
            console.error('Error resending OTP:', err);
            const message = handleFirebaseError(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePhoneNumber = async () => {
        setOtp('');
        setStep('details');
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
                <h1 className="text-2xl font-bold mb-2">Create Account</h1>
                <p className="text-muted-foreground">
                    {step === 'details'
                        ? 'Enter your details to get started'
                        : 'Enter the OTP sent to your mobile'}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {step === 'details' ? (
                    <>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Full Name"
                                className="pl-10"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                        </div>
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
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline">
                                Login
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

                        <div className="text-center">
                            {canResend ? (
                                <Button
                                    variant="link"
                                    className="p-0 h-auto font-normal text-primary"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                >
                                    Resend OTP
                                </Button>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Resend OTP in {timeLeft}s
                                </p>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={handleChangePhoneNumber}
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
