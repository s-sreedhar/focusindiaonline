'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, Heart, User } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect, useState } from 'react';

export function MobileNav() {
    const pathname = usePathname();
    const { getItemCount: getCartCount } = useCartStore();
    const { getItemCount: getWishlistCount } = useWishlistStore();
    const { user } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const cartCount = getCartCount();
    const wishlistCount = getWishlistCount();

    const navItems = [
        {
            label: 'Home',
            href: '/',
            icon: Home,
        },
        {
            label: 'Shop',
            href: '/shop',
            icon: ShoppingBag,
        },
        {
            label: 'Wishlist',
            href: '/wishlist',
            icon: Heart,
            count: wishlistCount,
        },
        {
            label: 'Cart',
            href: '/cart',
            icon: ShoppingCart,
            count: cartCount,
        },
        {
            label: 'Account',
            href: user ? '/account' : '/login',
            icon: User,
        },
    ];

    // Don't show on admin routes
    if (pathname?.startsWith('/admin')) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary transition-colors'
                                }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                                {mounted && item.count !== undefined && item.count > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                                        {item.count}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
