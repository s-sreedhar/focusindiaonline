'use client';

import { AdminSidebar, adminMenuItems } from '@/components/admin/sidebar';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert, Menu, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { NotificationsBell } from '@/components/admin/notifications-bell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // console.log('[Admin Layout] Auth state:', { user, loading, role: user?.role });

    if (!loading) {
      if (!user) {
        // console.log('[Admin Layout] No user found, redirecting to home');
        router.push('/');
      } else if (user.role !== 'superadmin') {
        // console.log('[Admin Layout] User role is not superadmin:', user.role);
        router.push('/');
      } else {
        // console.log('[Admin Layout] Access granted for superadmin');
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
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <div className="flex-1 md:ml-64 min-h-screen bg-[#f5f5f7] flex flex-col transition-all duration-300">
        {/* Mobile Header */}
        {/* Responsive Header */}
        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md p-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <div className="h-full bg-sidebar text-sidebar-foreground flex flex-col">
                    <div className="p-6 border-b border-sidebar-border/50">
                      <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Focus India</SheetTitle>
                      <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mt-1">Admin Portal</p>
                    </div>
                    <nav className="flex-1 flex flex-col px-4 py-4 min-h-0">
                      <MobileNavItems />
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <h1 className="font-bold text-lg md:hidden">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <NotificationsBell />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileNavItems() {
  const pathname = usePathname();
  // Ensure adminMenuItems is available. If it was exported from sidebar, we imported it.

  if (!adminMenuItems) return null;

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <SheetClose asChild key={item.href}>
              <Link href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-primary'
                    }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            </SheetClose>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-sidebar-border/50 bg-sidebar pb-6">
        <SheetClose asChild>
          <Button
            variant="ghost"
            className="w-full gap-2 justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => useAuthStore.getState().logout()}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </SheetClose>
      </div>
    </>
  );
}
