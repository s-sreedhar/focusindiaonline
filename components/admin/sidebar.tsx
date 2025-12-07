'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, ShoppingCart, Users, Settings, LogOut, Image, Award } from 'lucide-react';
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
    label: 'Testimonials',
    href: '/admin/testimonials',
    icon: Award,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-sidebar-border/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Focus India</h1>
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mt-1">Admin Portal</p>
      </div>

      <nav className="space-y-2 px-4 pt-4">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
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
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
        <Button variant="outline" className="w-full gap-2 justify-start">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
