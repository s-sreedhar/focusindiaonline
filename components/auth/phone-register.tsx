'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, where, getDocs, query } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Phone, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { handleFirebaseError } from '@/lib/error-utils';
import { hashPassword } from '@/lib/crypto';
import { createNotification } from '@/lib/services/notifications';

export function PhoneRegister() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState<'details' | 'otp' | 'password'>('details');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(15);
    const [canResend, setCanResend] = useState(false);
    const router = useRouter();
    const { setUser } = useAuthStore();

    const setupRecaptcha = () => {
        const container = document.getElementById('recaptcha-container');

        if (!container) return;

        // If we already have a verifier, clear it first to be safe
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                //console.error(e);
            }
            window.recaptchaVerifier = undefined;
        }

        container.innerHTML = '';

        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    // console.log('[PhoneRegister] reCAPTCHA solved');
                },
                'expired-callback': () => {
                    // console.log('[PhoneRegister] reCAPTCHA expired');
                    setError('reCAPTCHA expired. Please try again.');
                }
            });
        } catch (err) {
            //console.error('[PhoneRegister] Error initializing reCAPTCHA:', err);
        }
    };

    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(setupRecaptcha, 100);

        return () => {
            clearTimeout(timer);
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    //console.error('Error clearing recaptcha:', e);
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

    const handleSendOtp = async () => {
        // Validation
        if (!name || name.trim().length < 2) {
            setError('Please enter your full name (at least 2 characters)');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        const cleanedPhone = phoneNumber.replace(/\D/g, '');
        if (!cleanedPhone || cleanedPhone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            // console.log('[PhoneRegister] Sending OTP to:', formattedPhone);

            // Check if user already exists
            const digits = phoneNumber.replace(/\D/g, '');
            const last10 = digits.slice(-10);
            const normalizedPhone = `+91${last10}`;
            const candidates = [normalizedPhone, last10, digits, phoneNumber];

            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phone', 'in', candidates));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setError('This phone number is already registered.');
                setLoading(false);
                return;
            }

            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

            // console.log('[PhoneRegister] OTP sent successfully');
            setConfirmationResult(confirmation);
            setStep('otp');
            setTimeLeft(15);
            setCanResend(false);
        } catch (err: any) {
            //console.error('[PhoneRegister] Error sending OTP:', err);
            const message = handleFirebaseError(err);
            setError(message);

            // If it's an invalid-app-credential error, try to reset reCAPTCHA
            if (err.code === 'auth/invalid-app-credential') {
                // console.log('[PhoneRegister] Resetting reCAPTCHA due to invalid-app-credential');
                setupRecaptcha();
            } else {
                // Reset reCAPTCHA on other errors too, just in case
                if (window.recaptchaVerifier) {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = undefined;
                    // Re-init after a short delay
                    setTimeout(setupRecaptcha, 500);
                }
            }
        } finally {
            if (!error) { // Only unset loading if we didn't set an error (though error setting is async, this logic is a bit slightly flawed but safe enough here as we return early on error above)
                setLoading(false);
            }
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

            // console.log('[PhoneRegister] Verifying OTP...');
            const result = await confirmationResult.confirm(otp);
            // OTP Verified successfully
            // console.log('[PhoneRegister] OTP verified');

            // Move to password step
            setStep('password');
        } catch (err: any) {
            //console.error('[PhoneRegister] Error verifying OTP:', err);
            const message = handleFirebaseError(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = auth.currentUser;
            if (!user) {
                setError('Authentication session expired. Please try again.');
                setStep('details');
                return;
            }



            // Hash password
            // console.log('[PhoneRegister] Starting password hashing...');
            const hashedPassword = await hashPassword(password);
            // console.log('[PhoneRegister] Password hashing complete.');

            // Create user document in Firestore
            const userDocRef = doc(db, 'users', user.uid);

            // console.log('[PhoneRegister] Checking if user exists...');
            // Check if user already exists (edge case)
            const userDoc = await getDoc(userDocRef);
            // console.log('[PhoneRegister] User existence check complete. Exists:', userDoc.exists());

            const phoneNumber = user.phoneNumber ? user.phoneNumber.replace(/\D/g, '').slice(-10) : '';

            // Check if ANY user exists with this phone number (to prevent duplicate accounts if UID is different for some reason, though unlikely with Phone Auth, but requested)
            if (phoneNumber) {
                const q = query(collection(db, 'users'), where('phone', '==', phoneNumber));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty && !userDoc.exists()) {

                    setError('An account with this phone number already exists created by Admin. Please contact support.');
                    setLoading(false);
                    return;
                }
            }

            if (userDoc.exists()) {
                // console.log('[PhoneRegister] User already exists, updating...');
            }

            const newUserData = {
                uid: user.uid,
                displayName: name.trim(),
                email: email.trim(),
                phone: user.phoneNumber ? user.phoneNumber.replace(/\D/g, '').slice(-10) : '',
                role: 'customer',
                password: hashedPassword, // Store hashed password
                createdAt: serverTimestamp(),
            };

            // console.log('[PhoneRegister] Writing user document to Firestore...');
            await setDoc(userDocRef, newUserData, { merge: true });
            // console.log('[PhoneRegister] User document created successfully');

            // Notify Admin of New Customer
            await createNotification(
                'new_customer',
                'New Customer Joined',
                `${name.trim()} registered with ${email.trim()}.`,
                user.uid
            );

            setUser({
                id: user.uid,
                username: user.phoneNumber || '',
                displayName: name.trim(),
                email: email.trim(),
                phone: user.phoneNumber || '',
                createdAt: new Date().toISOString(),
                role: 'customer',
                authMethod: 'firebase'
            });

            // console.log('[PhoneRegister] Registration complete, redirecting...');
            router.push('/');

        } catch (err: any) {
            //console.error('[PhoneRegister] Error creating account:', err);
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
            //console.error('Error resending OTP:', err);
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
                        : step === 'otp'
                            ? 'Enter the OTP sent to your mobile'
                            : 'Set a password for your account'}
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
                            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="email"
                                placeholder="Email Address"
                                className="pl-10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                ) : step === 'otp' ? (
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
                ) : (
                    <>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create Password"
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
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                className="pl-10"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleCreateAccount}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Account
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
