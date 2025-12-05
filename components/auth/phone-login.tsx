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
import { Phone, Lock, Loader2 } from 'lucide-react';
import { handleFirebaseError } from '@/lib/error-utils';

export function PhoneLogin() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(15);
    const [canResend, setCanResend] = useState(false);
    const router = useRouter();
    const { setUser } = useAuthStore();

    useEffect(() => {
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
                            // reCAPTCHA solved, allow signInWithPhoneNumber.
                        },
                        'expired-callback': () => {
                            setError('reCAPTCHA expired. Please try again.');
                            if (window.recaptchaVerifier) {
                                window.recaptchaVerifier.clear();
                                window.recaptchaVerifier = undefined;
                            }
                        }
                    });
                } catch (err) {
                    console.error('Error initializing reCAPTCHA:', err);
                }
            }
        };

        initRecaptcha();

        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.error(e);
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
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
            setTimeLeft(15);
            setCanResend(false);
        } catch (err: any) {
            console.error('Error sending OTP:', err);
            const message = handleFirebaseError(err);
            setError(message);
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = undefined;
            }
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

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (confirmationResult) {
                const result = await confirmationResult.confirm(otp);
                const firebaseUser = result.user;

                // Check if user exists in Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);

                try {
                    const userDoc = await getDoc(userDocRef);
                    let role = 'customer';

                    if (!userDoc.exists()) {
                        // Create new user
                        await setDoc(userDocRef, {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            phone: firebaseUser.phoneNumber,
                            displayName: 'User',
                            role: 'customer',
                            createdAt: serverTimestamp(),
                        });
                    } else {
                        role = userDoc.data().role || 'customer';
                    }

                    // Update store
                    setUser({
                        id: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        username: firebaseUser.phoneNumber || '',
                        displayName: firebaseUser.displayName || 'User',
                        phone: firebaseUser.phoneNumber || '',
                        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                        role: role
                    });

                    if (role === 'superadmin') {
                        router.push('/admin');
                    } else {
                        router.push('/');
                    }
                } catch (firestoreErr: any) {
                    const message = handleFirebaseError(firestoreErr);
                    setError(message);
                }
            }
        } catch (err: any) {
            console.error('Error verifying OTP:', err);
            const message = handleFirebaseError(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">
                    {step === 'phone' ? 'Enter your mobile number to continue' : 'Enter the OTP sent to your mobile'}
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
                                placeholder="Mobile Number"
                                className="pl-10"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
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
                    </>
                ) : (
                    <>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                className="pl-10"
                                value={otp}
                                maxLength={6}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleVerifyOtp}
                            disabled={loading}
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
                            onClick={() => setStep('phone')}
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
