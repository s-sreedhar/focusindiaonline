'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, ShoppingBag, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    sales: 0,
    orders: 0,
    products: 0,
    users: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get counts
        const ordersSnapshot = await getCountFromServer(collection(db, 'orders'));
        const productsSnapshot = await getCountFromServer(collection(db, 'books'));
        const usersSnapshot = await getCountFromServer(collection(db, 'users'));

        // Calculate total sales (this might be expensive on large datasets, better to keep a running total in a separate doc)
        // For now, we'll just sum up the last 100 orders or similar, or just show 0 if not implemented
        // A better approach for "Total Sales" is to have an aggregation, but let's try to sum all for now or just leave it as a placeholder logic
        // We will just fetch recent orders and sum them for "Recent Sales" to be safe

        const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        const ordersDocs = await getDocs(ordersQuery);
        const orders = ordersDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setRecentOrders(orders);

        setStats({
          sales: 0, // Placeholder, needs aggregation logic
          orders: ordersSnapshot.data().count,
          products: productsSnapshot.data().count,
          users: usersSnapshot.data().count
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Sales',
      value: `₹${stats.sales.toLocaleString()}`,
      change: 'Needs Aggregation',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Total Orders',
      value: stats.orders.toString(),
      change: 'Lifetime',
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      label: 'Total Products',
      value: stats.products.toString(),
      change: 'In Inventory',
      icon: BarChart3,
      color: 'text-purple-600',
    },
    {
      label: 'Total Users',
      value: stats.users.toString(),
      change: 'Registered',
      icon: Users,
      color: 'text-orange-600',
    },
  ];

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      <div className="mb-8">
        <AnalyticsDashboard />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => {
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
                  {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                    <tr key={i} className="border-b hover:bg-secondary">
                      <td className="py-3 font-semibold">#{order.id.slice(0, 8)}</td>
                      <td className="py-3">{order.shippingAddress?.firstName || 'Guest'}</td>
                      <td className="py-3 font-semibold">₹{order.totalAmount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">No orders found</td>
                    </tr>
                  )}
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
                <p className="text-sm font-semibold text-yellow-900">System Status</p>
                <p className="text-xs text-yellow-700 mt-1">Dashboard connected to Firestore</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
