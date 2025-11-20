'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, ShoppingBag, Users, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      label: 'Total Sales',
      value: '₹45,230',
      change: '+12.5%',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Orders Today',
      value: '24',
      change: '+5 from yesterday',
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      label: 'Total Products',
      value: '1,247',
      change: '+32 new this month',
      icon: BarChart3,
      color: 'text-purple-600',
    },
    {
      label: 'Active Users',
      value: '3,421',
      change: '+18% growth',
      icon: Users,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold mb-2">{stat.value}</p>
              <p className="text-xs text-green-600">{stat.change}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Order ID</th>
                    <th className="text-left py-2">Customer</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: '#ORD-001', customer: 'Rajesh Kumar', amount: '₹850', status: 'Delivered' },
                    { id: '#ORD-002', customer: 'Priya Singh', amount: '₹620', status: 'Shipped' },
                    { id: '#ORD-003', customer: 'Amit Patel', amount: '₹1,200', status: 'Processing' },
                    { id: '#ORD-004', customer: 'Neha Sharma', amount: '₹445', status: 'Pending' },
                  ].map((order, i) => (
                    <tr key={i} className="border-b hover:bg-secondary">
                      <td className="py-3 font-semibold">{order.id}</td>
                      <td className="py-3">{order.customer}</td>
                      <td className="py-3 font-semibold">{order.amount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Alerts */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Alerts
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900">Low Stock</p>
                <p className="text-xs text-yellow-700 mt-1">5 products below threshold</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-900">Pending Orders</p>
                <p className="text-xs text-red-700 mt-1">8 orders need attention</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">New Reviews</p>
                <p className="text-xs text-blue-700 mt-1">12 customer reviews waiting</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
