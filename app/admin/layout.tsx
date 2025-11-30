'use client';

import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    console.log('[Admin Layout] Auth state:', { user, loading, role: user?.role });

    if (!loading) {
      if (!user) {
        console.log('[Admin Layout] No user found, redirecting to home');
        router.push('/');
      } else if (user.role !== 'superadmin') {
        console.log('[Admin Layout] User role is not superadmin:', user.role);
        router.push('/');
      } else {
        console.log('[Admin Layout] Access granted for superadmin');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the admin panel.
            {user ? ` Your current role is: ${user.role}` : ' Please log in with an admin account.'}
          </p>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact the system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
