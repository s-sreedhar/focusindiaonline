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

export function PhoneLogin() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState('');
    const router = useRouter();
    const { setUser } = useAuthStore();

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                },
            });
        }
    }, []);

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
        } catch (err: any) {
            console.error('Error sending OTP:', err);
            setError(err.message || 'Failed to send OTP. Please try again.');
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
            if (confirmationResult) {
                const result = await confirmationResult.confirm(otp);
                const user = result.user;

                // Update store
                setUser({
                    id: user.uid,
                    email: user.email || '',
                    username: user.phoneNumber || '',
                    displayName: user.displayName || 'User',
                    phone: user.phoneNumber || '',
                    createdAt: user.metadata.creationTime || new Date().toISOString(),
                    role: 'user' // Default role, should be fetched from DB in real app
                });

                router.push('/');
            }
        } catch (err: any) {
            console.error('Error verifying OTP:', err);
            setError('Invalid OTP. Please try again.');
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
