import { toast } from 'sonner';
import type { User } from '@/lib/auth-store';
import type { CartItem } from '@/lib/cart-store';

const PENDING_CART_KEY = 'pending_cart_action';

export interface PendingCartAction {
  type: 'add_to_cart' | 'buy_now';
  item: CartItem;
  timestamp: number;
}

/** Registered customer (excludes guests and logged-out). Admins may still shop. */
export function isRegisteredShopUser(
  user: User | null,
  isAuthenticated: boolean,
  authLoading: boolean
): boolean {
  if (authLoading) return false;
  if (!isAuthenticated || !user) return false;
  if (user.role === 'guest') return false;
  return true;
}

/** Safe in-app path from `returnUrl` query (open-redirect safe). */
export function sanitizeReturnUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  if (decoded.startsWith('/login') || decoded.startsWith('/register')) return null;
  return decoded;
}

/** Store pending cart action before redirecting to login */
export function setPendingCartAction(action: PendingCartAction): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_CART_KEY, JSON.stringify(action));
  } catch {
    // localStorage might be full or disabled
  }
}

/** Get and clear pending cart action after login */
export function getPendingCartAction(): PendingCartAction | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(PENDING_CART_KEY);
    if (!stored) return null;
    
    const action = JSON.parse(stored) as PendingCartAction;
    
    // Clear it immediately
    localStorage.removeItem(PENDING_CART_KEY);
    
    // Check if it's not too old (5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - action.timestamp > fiveMinutes) {
      return null;
    }
    
    return action;
  } catch {
    localStorage.removeItem(PENDING_CART_KEY);
    return null;
  }
}

export function toastRedirectToLogin(
  router: { push: (href: string) => void },
  returnPath: string,
  message = 'Please sign in to add items to your cart'
): void {
  toast.info(message, { duration: 4000 });
  const path =
    returnPath && returnPath.startsWith('/') && !returnPath.startsWith('//') ? returnPath : '/';
  router.push(`/login?returnUrl=${encodeURIComponent(path)}`);
}
