'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, ShoppingCart, Users, Settings, LogOut, Image, Award, Tag, Megaphone, Package, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const adminMenuItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
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
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
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
    label: 'Testimonials',
    href: '/admin/testimonials',
    icon: Award,
  },
  {
    label: 'Enquiries',
    href: '/admin/enquiries',
    icon: MessageSquare,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 min-h-screen fixed left-0 top-0 z-50 shadow-sm transition-all duration-300">
      <div className="p-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-md">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent transform hover:scale-105 transition-transform cursor-default">Focus India</h1>
        <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase mt-1.5 ml-0.5">Admin Portal</p>
      </div>

      <nav className="space-y-1.5 px-3 pt-6">
        {adminMenuItems.map((item) => {
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
        <Button variant="outline" className="w-full gap-2 justify-start bg-white/50 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
