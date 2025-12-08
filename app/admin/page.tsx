'use client';

import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';

export default function AdminDashboard() {
  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome back! Here's your business overview.
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
