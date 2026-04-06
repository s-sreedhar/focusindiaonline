'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { getPendingCartAction } from '@/lib/shop-auth';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';

export function PendingCartHandler() {
    const { user, isAuthenticated, loading } = useAuthStore();
    const { addItem } = useCartStore();
    const router = useRouter();
    const pathname = usePathname();
    const lastProcessedPath = useRef<string | null>(null);

    useEffect(() => {
        // Wait for auth to finish loading
        if (loading) return;
        
        // Must be authenticated with a real account (not guest)
        if (!isAuthenticated || !user || user.role === 'guest') return;

        // Don't process on login/register pages
        if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) return;

        // Prevent processing the same path twice
        if (lastProcessedPath.current === pathname) return;

        const pendingAction = getPendingCartAction();
        if (!pendingAction) return;

        // Mark this path as processed
        lastProcessedPath.current = pathname;

        // Execute the pending action
        try {
            addItem(pendingAction.item);
            
            if (pendingAction.type === 'buy_now') {
                toast.success('Item added to cart! Redirecting to checkout...');
                // Use replace to avoid back-button issues
                setTimeout(() => {
                    router.replace('/checkout');
                }, 300);
            } else {
                toast.success(`"${pendingAction.item.title}" has been added to your cart!`);
            }
        } catch (error) {
            console.error('Failed to process pending cart action:', error);
        }
    }, [loading, isAuthenticated, user, addItem, router, pathname]);

    return null;
}
