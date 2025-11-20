'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { ShoppingBag, MapPin, User, LogOut, Heart, BarChart3 } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const menuItems = [
    {
      icon: ShoppingBag,
      label: 'My Orders',
      href: '/account/orders',
      description: 'View your order history'
    },
    {
      icon: MapPin,
      label: 'Addresses',
      href: '/account/addresses',
      description: 'Manage your addresses'
    },
    {
      icon: User,
      label: 'Profile Settings',
      href: '/account/profile',
      description: 'Edit your profile information'
    },
    {
      icon: Heart,
      label: 'Wishlist',
      href: '/wishlist',
      description: 'View your saved items'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">My Account</h1>
                <p className="text-muted-foreground">Welcome back, {user.displayName}!</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>

            {/* User Info Card */}
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Email</p>
                  <p className="font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Username</p>
                  <p className="font-semibold">{user.username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Member Since</p>
                  <p className="font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <Icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-bold mb-1">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-primary">3</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-primary">₹2,450</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Wishlist Items</p>
                <p className="text-3xl font-bold text-primary">5</p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
