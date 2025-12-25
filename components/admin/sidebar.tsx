'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, ShoppingCart, Users, Settings, LogOut, Image, Award, Tag, Megaphone, Package, MessageSquare, FolderIcon, Shield, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';

export const adminMenuItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: FolderIcon,
  },
  {
    label: 'Books',
    href: '/admin/books',
    icon: BookOpen,
  },
  {
    label: 'Combos',
    href: '/admin/combos',
    icon: Package,
  },
  {
    label: 'Test Series',
    href: '/admin/test-series',
    icon: BookOpen,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Admins',
    href: '/admin/admins',
    icon: Shield,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Banners',
    href: '/admin/banners',
    icon: Image,
  },
  {
    label: 'Coupons',
    href: '/admin/coupons',
    icon: Tag,
  },
  {
    label: 'Popups',
    href: '/admin/popups',
    icon: Megaphone,
  },
  {
    label: 'Reviews',
    href: '/admin/testimonials',
    icon: Award,
  },
  {
    label: 'Enquiries',
    href: '/admin/enquiries',
    icon: MessageSquare,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredItems = adminMenuItems.filter((item) => {
    // If user role is 'admin', show only specific items
    if (user?.role === 'admin') {
      const allowedItems = ['Dashboard', 'Categories', 'Books', 'Combos', 'Orders', 'Users', 'Enquiries', 'Banners', 'Reviews', 'Test Series'];
      return allowedItems.includes(item.label);
    }
    // For 'super-admin' or other roles, show all
    return true;
  });

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 min-h-screen fixed left-0 top-0 z-50 shadow-sm transition-all duration-300">
      <div className="p-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-md">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent transform hover:scale-105 transition-transform cursor-default">Focus India</h1>
        <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase mt-1.5 ml-0.5">Admin Portal</p>
      </div>

      <nav className="space-y-1.5 px-3 pt-6">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02] font-medium'
                  : 'hover:bg-gray-100/80 text-gray-600 hover:text-primary hover:scale-[1.02] hover:shadow-sm'
                  }`}
              >
                <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-primary-foreground' : 'text-gray-400 group-hover:text-primary'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
        <Button
          variant="outline"
          className="w-full gap-2 justify-start bg-white/50 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300"
          onClick={() => useAuthStore.getState().logout()}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
        <Link href="/">
          <Button
            variant="outline"
            className="w-full gap-2 justify-start bg-white/50 border-gray-200 mt-2 hover:bg-gray-100 transition-all duration-300"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </aside>
  );
}
