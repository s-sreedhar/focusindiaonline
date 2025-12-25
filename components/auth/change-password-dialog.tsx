'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/lib/auth-store';
import { hashPassword, verifyPassword } from '@/lib/crypto';

interface ChangePasswordDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function ChangePasswordDialog({ children, trigger }: ChangePasswordDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuthStore();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const resetForm = () => {
        setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!user) return;

        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            toast.error('All fields are required');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }

        if (formData.currentPassword === formData.newPassword) {
            toast.error('New password cannot be same as current password');
            return;
        }

        setLoading(true);

        try {
            // 1. Verify current password
            // Since we store hashed password in Firestore, we need to fetch it first.
            const userRef = doc(db, 'users', user.id);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                toast.error('User not found');
                return;
            }

            const userData = userDoc.data();

            // If user doesn't have a password set (e.g. only OTP login ever), we might need a different flow.
            // But requirement says "change their password". Assume they know current or we handle "set password"
            if (!userData.password) {
                // TODO: Handle "Set Password" flow if they don't have one?
                // For now, let's treat it as they must provide current password if they have one.
                // If they don't have one, maybe we should skip current password check? 
                // Security risk. Better enforce current password check always unless we verify OTP.
                // Let's assume they have a password. If not, this feature might fail for them, or we prompt "No password set".
                toast.error('You do not have a password set. Please use Forgot Password or set one via OTP flow.');
                return;
            }

            const isCurrentValid = await verifyPassword(formData.currentPassword, userData.password);

            if (!isCurrentValid) {
                toast.error('Incorrect current password');
                return;
            }

            // 2. Update to new password
            const newHashedPassword = await hashPassword(formData.newPassword);

            await updateDoc(userRef, {
                password: newHashedPassword
            });

            toast.success('Password changed successfully');
            setIsOpen(false);
            resetForm();

        } catch (error) {
            //console.error('Error changing password:', error);
            toast.error('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
        }}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Change Password</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your current password and a new password to update your account security.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2 relative">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            name="currentPassword"
                            type={showCurrent ? "text" : "password"}
                            value={formData.currentPassword}
                            onChange={handleChange}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 bottom-0.5 h-8 w-8 p-0"
                            onClick={() => setShowCurrent(!showCurrent)}
                        >
                            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="grid gap-2 relative">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type={showNew ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={handleChange}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 bottom-0.5 h-8 w-8 p-0"
                            onClick={() => setShowNew(!showNew)}
                        >
                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showNew ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
