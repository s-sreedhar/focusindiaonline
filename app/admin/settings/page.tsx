'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    siteName: 'Focus India Online',
    siteUrl: 'https://timesbookstall.com',
    email: 'support@timesbookstall.com',
    phone: '+919959594444',
    shippingCharges: 50,
    freeShippingThreshold: 500,
    currency: 'INR',
  });

  const [profileForm, setProfileForm] = useState({
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        displayName: user.displayName || '',
      }));
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      toast.success('Site settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !auth.currentUser) return;

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (profileForm.password && profileForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updates: any = {};
      let profileUpdated = false;

      // Update Display Name
      if (profileForm.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: profileForm.displayName
        });
        updates.displayName = profileForm.displayName;
        profileUpdated = true;
      }

      // Update Password
      if (profileForm.password) {
        await updatePassword(auth.currentUser, profileForm.password);
        profileUpdated = true;
      }

      // Update Firestore if needed
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', user.id), updates);
      }

      if (profileUpdated) {
        toast.success('Profile updated successfully');
        setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        toast.info('No changes to update');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log in again to update your password');
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage site configuration and your profile</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mobile Number</label>
              <Input
                value={user?.phone || user?.username || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Mobile number cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Display Name</label>
              <Input
                name="displayName"
                value={profileForm.displayName}
                onChange={handleProfileChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">New Password</label>
                <Input
                  type="password"
                  name="password"
                  value={profileForm.password}
                  onChange={handleProfileChange}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={profileForm.confirmPassword}
                  onChange={handleProfileChange}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile}>
              {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Profile
            </Button>
          </div>
        </Card>

        {/* Site Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Site Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Site Name</label>
              <Input
                name="siteName"
                value={settings.siteName}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Site URL</label>
              <Input
                name="siteUrl"
                value={settings.siteUrl}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  name="email"
                  value={settings.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  name="phone"
                  value={settings.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Shipping Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Shipping Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Standard Shipping Charge (₹)</label>
              <Input
                type="number"
                name="shippingCharges"
                value={settings.shippingCharges}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Free Shipping Threshold (₹)</label>
              <Input
                type="number"
                name="freeShippingThreshold"
                value={settings.freeShippingThreshold}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Currency</label>
              <Input
                name="currency"
                value={settings.currency}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button size="lg" onClick={handleSave}>Save Site Settings</Button>
          <Button variant="outline" size="lg">Reset</Button>
        </div>
      </div>
    </div>
  );
}
