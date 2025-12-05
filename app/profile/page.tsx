'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useWishlistStore } from '@/lib/wishlist-store';
import { ProductCard } from '@/components/product-card';
import { Loader2, User, ShoppingBag, Heart, LogOut } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user, logout, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const { items: wishlistItems } = useWishlistStore();

    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        displayName: '',
        phone: '',
        email: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        }
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            setProfileData({
                displayName: user.displayName || '',
                phone: user.phone || '',
                email: user.email || '',
                address: user.address || {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: ''
                }
            });
        }
    }, [user, authLoading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const userId = user.id || (user as any).uid;
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                displayName: profileData.displayName,
                phone: profileData.phone,
                address: profileData.address
            });
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                                    <User className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="font-bold text-lg text-center">{user.displayName || 'User'}</h2>
                                <p className="text-sm text-muted-foreground text-center">{user.email || user.phone}</p>
                            </div>

                            <nav className="space-y-2">
                                <Button
                                    variant={activeTab === 'profile' ? 'default' : 'ghost'}
                                    className="w-full justify-start"
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    My Profile
                                </Button>
                                <Button
                                    variant={activeTab === 'orders' ? 'default' : 'ghost'}
                                    className="w-full justify-start"
                                    onClick={() => setActiveTab('orders')}
                                >
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Orders
                                </Button>
                                <Button
                                    variant={activeTab === 'wishlist' ? 'default' : 'ghost'}
                                    className="w-full justify-start"
                                    onClick={() => setActiveTab('wishlist')}
                                >
                                    <Heart className="w-4 h-4 mr-2" />
                                    Wishlist
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Button>
                            </nav>
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {activeTab === 'profile' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>My Profile</CardTitle>
                                <CardDescription>Manage your personal information and address.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={profileData.displayName}
                                            onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            disabled={!isEditing} // Phone might be immutable if used for login
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            value={profileData.email}
                                            disabled={true} // Email usually immutable or requires verification
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Shipping Address</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="street">Street Address</Label>
                                            <Input
                                                id="street"
                                                value={profileData.address.street}
                                                onChange={(e) => setProfileData({
                                                    ...profileData,
                                                    address: { ...profileData.address, street: e.target.value }
                                                })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={profileData.address.city}
                                                onChange={(e) => setProfileData({
                                                    ...profileData,
                                                    address: { ...profileData.address, city: e.target.value }
                                                })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input
                                                id="state"
                                                value={profileData.address.state}
                                                onChange={(e) => setProfileData({
                                                    ...profileData,
                                                    address: { ...profileData.address, state: e.target.value }
                                                })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zipCode">ZIP Code</Label>
                                            <Input
                                                id="zipCode"
                                                value={profileData.address.zipCode}
                                                onChange={(e) => setProfileData({
                                                    ...profileData,
                                                    address: { ...profileData.address, zipCode: e.target.value }
                                                })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                value={profileData.address.country}
                                                onChange={(e) => setProfileData({
                                                    ...profileData,
                                                    address: { ...profileData.address, country: e.target.value }
                                                })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4">
                                    {isEditing ? (
                                        <>
                                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
                                            <Button onClick={handleSaveProfile} disabled={saving}>
                                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Changes
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'orders' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>My Orders</CardTitle>
                                <CardDescription>View your order history and status.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    No orders found.
                                </div>
                                {/* TODO: Implement order list fetching */}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'wishlist' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold">My Wishlist</h2>
                                <p className="text-muted-foreground">Items you've saved for later.</p>
                            </div>

                            {wishlistItems.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Heart className="w-12 h-12 text-muted-foreground mb-4" />
                                        <p className="text-lg font-medium">Your wishlist is empty</p>
                                        <Button variant="link" onClick={() => router.push('/books')}>Browse Books</Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {wishlistItems.map((item) => (
                                        <ProductCard
                                            key={item.bookId}
                                            id={item.bookId}
                                            title={item.title}
                                            author={item.author}
                                            price={item.price}
                                            image={item.image}
                                            slug={item.slug}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
