'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { User, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { handleFirebaseError } from '@/lib/error-utils';
import Link from 'next/link';
import { verifyPassword, hashPassword } from '@/lib/crypto';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

export function PhoneLogin() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Forgot password states
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [step, setStep] = useState<'identifier' | 'password' | 'forgot-otp' | 'forgot-new-password'>('identifier');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [userData, setUserData] = useState<any>(null);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [canResend, setCanResend] = useState(false);

    const router = useRouter();
    const { setUser } = useAuthStore();

    const setupRecaptcha = () => {
        const container = document.getElementById('recaptcha-container');

        if (!container) return;

        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) { }
            window.recaptchaVerifier = undefined;
        }

        container.innerHTML = '';

        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => { },
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
                }
            });
        } catch (err) { }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'forgot-otp' && timeLeft > 0 && !canResend) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft, canResend]);

    const checkUserExists = async (ident: string) => {
        try {
            const response = await fetch('/api/auth/check-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier: ident }),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                const data = await response.json();
                throw new Error(data.error || 'Failed to check user');
            }

            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error('Error checking user:', error);
            throw error;
        }
    };

    const handleContinue = async () => {
        if (!identifier.trim()) {
            setError('Please enter your Mobile Number or Email');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await checkUserExists(identifier.trim());

            if (!user) {
                setError('User not registered. Please create an account.');
                setLoading(false);
                return;
            }

            setUserData(user);
            setStep('password');
        } catch (err: any) {
            setError('Failed to verify user. Please try again.');
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
            // Verify password locally
            const isValid = await verifyPassword(password, userData.password);

            if (!isValid) {
                setError('Invalid password');
                setLoading(false);
                return;
            }

            // Get custom token from backend
            const tokenResponse = await fetch('/api/auth/custom-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: userData.uid })
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to create authentication token');
            }

            const { customToken } = await tokenResponse.json();

            // Sign in with custom token to establish Firebase Auth session
            const userCredential = await signInWithCustomToken(auth, customToken);

            setUser({
                id: userCredential.user.uid,
                username: identifier.trim(),
                displayName: userData?.displayName || 'User',
                email: userData?.email || '',
                phone: userData?.phone || '',
                createdAt: userCredential.user.metadata.creationTime || new Date().toISOString(),
                role: userData?.role || 'customer',
                authMethod: 'firebase'
            });

            // Redirect based on role
            if (userData.role === 'superadmin' || userData.role === 'admin') {
                if (typeof window !== 'undefined') {
                    window.location.href = '/admin';
                }
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

    const handleTriggerForgotPasswordOTP = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // Setup recaptcha if not present
            setupRecaptcha();

            // Format phone number
            const phoneStr = userData.phone;
            if (!phoneStr) {
                throw new Error("No mobile number registered to this account.");
            }
            const digits = phoneStr.replace(/\D/g, '');
            const finalPhone = digits.length === 10 ? `+91${digits}` : (!phoneStr.startsWith('+') ? `+${digits}` : phoneStr);

            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, finalPhone, appVerifier);

            setConfirmationResult(confirmation);
            setStep('forgot-otp');
            setTimeLeft(15);
            setCanResend(false);
            setSuccessMessage(`OTP sent to your registered mobile number ending in ${finalPhone.slice(-4)}`);

        } catch (err: any) {
            setError(handleFirebaseError(err) || 'Failed to send OTP.');
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = undefined;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!confirmationResult) {
                setError('Session expired. Please request OTP again.');
                return;
            }
            await confirmationResult.confirm(otp);
            setSuccessMessage('OTP verified. Please set your new password.');
            setStep('forgot-new-password');
        } catch (err: any) {
            setError(handleFirebaseError(err) || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const hashedPassword = await hashPassword(newPassword);

            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: userData.uid,
                    password: newPassword, // raw for firebase auth
                    hashedPassword // for firestore verify check
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update password');
            }

            setSuccessMessage('Password updated successfully! Please login.');
            setStep('password');
            setPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setOtp('');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">
                    {step === 'identifier'
                        ? 'Enter your Email or Mobile Number'
                        : step === 'password'
                            ? 'Enter your password'
                            : step === 'forgot-otp'
                                ? 'Enter the OTP sent to your mobile'
                                : 'Create a new password'}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm">
                    {successMessage}
                </div>
            )}

            {/* Hidden recaptcha element for Firebase auth */}
            <div id="recaptcha-container"></div>

            <div className="space-y-4">
                {step === 'identifier' ? (
                    <>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Email or Mobile Number"
                                className="pl-10"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                disabled={loading}
                                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
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
                                onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
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
                            Login
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={handleTriggerForgotPasswordOTP}
                            disabled={loading}
                        >
                            Forgot Password?
                        </Button>

                        <Button
                            variant="link"
                            className="w-full mt-2"
                            onClick={() => {
                                setStep('identifier');
                                setPassword('');
                                setUserData(null);
                                setSuccessMessage('');
                                setError('');
                            }}
                            disabled={loading}
                        >
                            Change Email / Mobile
                        </Button>
                    </>
                ) : step === 'forgot-otp' ? (
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
                                disabled={loading}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleVerifyOTP}
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
                                    onClick={handleTriggerForgotPasswordOTP}
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
                            onClick={() => {
                                setStep('password');
                                setError('');
                                setSuccessMessage('');
                                setOtp('');
                            }}
                            disabled={loading}
                        >
                            Back to Login
                        </Button>
                    </>
                ) : (
                    <>
                        {/* New Password Step */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                className="pl-10 pr-10"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
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
                                placeholder="Confirm New Password"
                                className="pl-10"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                disabled={loading}
                                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Reset Password
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
}
