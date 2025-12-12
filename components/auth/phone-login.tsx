'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Phone, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { handleFirebaseError } from '@/lib/error-utils';
import Link from 'next/link';
import { verifyPassword } from '@/lib/crypto';

export function PhoneLogin() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
    const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(15);
    const [canResend, setCanResend] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const router = useRouter();
    const { setUser } = useAuthStore();

    const setupRecaptcha = () => {
        const container = document.getElementById('recaptcha-container');

        if (!container) return;

        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.error(e);
            }
            window.recaptchaVerifier = undefined;
        }

        container.innerHTML = '';

        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    // reCAPTCHA solved
                },
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
                }
            });
        } catch (err) {
            console.error('Error initializing reCAPTCHA:', err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(setupRecaptcha, 100);

        return () => {
            clearTimeout(timer);
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.error(e);
                }
                window.recaptchaVerifier = undefined;
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

    const checkUserExists = async (phone: string) => {
        // Prepare multiple formats to check against
        const digits = phone.replace(/\D/g, ''); // Ensure only digits
        const last10 = digits.slice(-10);

        const candidates = [
            `+91${last10}`, // Format: +919876543210
            last10,         // Format: 9876543210
            digits,         // Format: whatever full digits user has
            phone           // Original input just in case
        ];

        // Remove duplicates
        const uniqueCandidates = Array.from(new Set(candidates));

        const usersRef = collection(db, 'users');
        // Use 'in' query to check all formats at once
        const q = query(usersRef, where('phone', 'in', uniqueCandidates));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        return querySnapshot.docs[0].data();
    };

    const handleContinue = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await checkUserExists(phoneNumber);

            if (!user) {
                setError('User not registered. Please create an account.');
                setLoading(false);
                return;
            }

            setUserData(user);

            // If user has a password, ask how they want to login
            if (user.password) {
                // Default to password mode if available, or let user choose
                // For now, let's show a mode selection or just default to password?
                // The prompt said "user can give password or go with otp login"
                // Let's switch to a mode selection state or just show password input with "Use OTP" option
                setStep('password');
                setLoginMode('password');
            } else {
                // No password set, force OTP
                setLoginMode('otp');
                await sendOtp();
            }

        } catch (err: any) {
            console.error('Error checking user:', err);
            setError('Failed to verify user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const sendOtp = async () => {
        setLoading(true);
        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
            setLoginMode('otp');
            setTimeLeft(15);
            setCanResend(false);
        } catch (err: any) {
            console.error('Error sending OTP:', err);
            const message = handleFirebaseError(err);
            setError(message);

            if (err.code === 'auth/invalid-app-credential') {
                console.log('[PhoneLogin] Resetting reCAPTCHA due to invalid-app-credential');
                setupRecaptcha();
            } else {
                if (window.recaptchaVerifier) {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = undefined;
                    setTimeout(setupRecaptcha, 500);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async () => {
        if (!password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Verify password
            const isValid = await verifyPassword(password, userData.password);

            if (!isValid) {
                setError('Invalid password');
                setLoading(false);
                return;
            }

            // Login successful (Local state only, no Firebase Auth token if using password only)
            // WARNING: This does not establish a Firebase Auth session.
            // If the app relies on Firebase Auth rules, this will fail.
            // However, based on the prompt, we are storing password in DB and logging in.

            setUser({
                id: userData.uid,
                username: userData.phone || '',
                displayName: userData.displayName || 'User',
                phone: userData.phone || '',
                createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                role: userData.role || 'customer',
                authMethod: 'custom'
            });

            if (userData.role === 'superadmin') {
                router.push('/admin');
            } else {
                router.push('/');
            }

        } catch (err: any) {
            console.error('Error logging in:', err);
            setError('Login failed. Please try again.');
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

                // We already fetched user data in the first step
                // But let's refresh it or use what we have

                setUser({
                    id: firebaseUser.uid,
                    username: firebaseUser.phoneNumber || '',
                    displayName: userData?.displayName || 'User',
                    phone: firebaseUser.phoneNumber || '',
                    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                    role: userData?.role || 'customer',
                    authMethod: 'firebase'
                });

                if (userData?.role === 'superadmin') {
                    router.push('/admin');
                } else {
                    router.push('/');
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

    const handleResendOtp = async () => {
        if (!canResend) return;
        await sendOtp();
    };

    return (
        <Card className="p-8 w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">
                    {step === 'phone'
                        ? 'Enter your mobile number to continue'
                        : step === 'password'
                            ? 'Enter your password'
                            : 'Enter the OTP sent to your mobile'}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <div id="recaptcha-container"></div>
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

                        <Button
                            className="w-full"
                            onClick={handleContinue}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Continue
                        </Button>
                        <div className="text-center text-sm text-muted-foreground mt-4">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-primary hover:underline">
                                Register
                            </Link>
                        </div>
                    </>
                ) : step === 'password' ? (
                    <>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="pl-10 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                        <Button
                            className="w-full"
                            onClick={handlePasswordLogin}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Login with Password
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={sendOtp}
                            disabled={loading}
                        >
                            Login with OTP
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full mt-2"
                            onClick={() => {
                                setStep('phone');
                                setPassword('');
                            }}
                            disabled={loading}
                        >
                            Change Phone Number
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
