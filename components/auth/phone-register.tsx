'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';
import { sanitizeReturnUrl } from '@/lib/shop-auth';
import { Phone, Lock, User, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { hashPassword } from '@/lib/crypto';

export function PhoneRegister() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser } = useAuthStore();

    const returnUrlParam = searchParams.get('returnUrl');
    const loginHref =
        returnUrlParam != null && returnUrlParam !== ''
            ? `/login?returnUrl=${encodeURIComponent(returnUrlParam)}`
            : '/login';

    const handleCreateAccount = async () => {
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
            const hashedPassword = await hashPassword(password);

            // 1. Ask backend to create the user account (which validates duplicates)
            const createRes = await fetch('/api/auth/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: name.trim(), 
                    email: email.trim(), 
                    phone: cleanedPhone, 
                    password,
                    hashedPassword
                }),
            });

            const createData = await createRes.json();

            if (!createRes.ok) {
                setError(createData.error || 'Failed to create account. Please try again.');
                setLoading(false);
                return;
            }

            // 2. Fetch a custom token to instantly log the user in
            const tokenResponse = await fetch('/api/auth/custom-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: createData.uid })
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to create authentication token');
            }

            const { customToken } = await tokenResponse.json();

            // 3. Authenticate with Firebase on the client so the session is established securely
            const userCredential = await signInWithCustomToken(auth, customToken);
            const firebaseUser = userCredential.user;

            setUser({
                id: firebaseUser.uid,
                username: email.trim(),
                displayName: name.trim(),
                email: email.trim(),
                phone: `+91${cleanedPhone}`,
                createdAt: new Date().toISOString(),
                role: 'customer',
                authMethod: 'firebase'
            });

            const nextPath = sanitizeReturnUrl(returnUrlParam) ?? '/';
            // Use window.location for full page refresh to ensure auth state propagates
            window.location.href = nextPath;

        } catch (err: any) {
            console.error('Error creating account:', err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Create Account</h1>
                <p className="text-muted-foreground">
                    Enter your details to register
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
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
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
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

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href={loginHref} className="text-primary hover:underline">
                        Login
                    </Link>
                </div>
            </div>
        </Card>
    );
}
