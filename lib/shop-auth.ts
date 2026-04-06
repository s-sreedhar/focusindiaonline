import { toast } from 'sonner';
import type { User } from '@/lib/auth-store';

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

export function toastRedirectToLogin(
  router: { push: (href: string) => void },
  pathname: string,
  message = 'Please sign in to add items to your cart'
): void {
  toast.info(message, { duration: 4000 });
  const path =
    pathname && pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '/';
  router.push(`/login?returnUrl=${encodeURIComponent(path)}`);
}
