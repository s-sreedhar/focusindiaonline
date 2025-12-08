'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { Loader2, Package, Eye, Filter } from 'lucide-react';
import { Order } from '@/lib/types';
import { sendEmail } from '@/lib/brevo';
import { getEmailTemplate } from '@/lib/email-templates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });

      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        const newOrder = { ...updatedOrder, status: newStatus } as Order;

        // Update list
        setOrders(prev => prev.map(order =>
          order.id === orderId ? newOrder : order
        ));

        // Update selected order if it's the one being modified
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(newOrder);
        }

        // Send email notification
        if (newOrder.shippingAddress?.email) {
          const { subject, htmlContent } = getEmailTemplate(newStatus, newOrder);
          await sendEmail(
            newOrder.shippingAddress.email,
            subject,
            htmlContent
          );
        }
      }

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        adminNotes: adminNotes
      });

      const updatedOrder = { ...selectedOrder, adminNotes };

      // Update list
      setOrders(prev => prev.map(o =>
        o.id === selectedOrder.id ? updatedOrder : o
      ));

      // Update selected order so the change sticks in the UI context
      setSelectedOrder(updatedOrder);

      toast.success("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setAdminNotes(order.adminNotes || '');
    setIsDialogOpen(true);
  };

  const filteredOrders = orders.filter(order =>
    statusFilter === 'all' || order.status === statusFilter
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'shipped': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'processing': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'placed': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'returned': return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Order No</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Items</th>
                <th className="px-6 py-3 font-semibold">Total</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-medium">#{order.orderId || order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.shippingAddress?.fullName || 'Guest'}</div>
                    <div className="text-xs text-muted-foreground">{order.shippingAddress?.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <span key={idx} className="text-xs">
                          {item.quantity}x {item.title.slice(0, 20)}...
                        </span>
                      ))}
                      {order.items?.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{order.items.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold">₹{order.totalAmount}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {order.status || 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.orderId || selectedOrder.id}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 py-4">
                <div>
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{selectedOrder.shippingAddress?.fullName || 'N/A'}</p>
                    <p>{selectedOrder.shippingAddress?.street || ''}</p>
                    <p>{selectedOrder.shippingAddress?.city || ''}, {selectedOrder.shippingAddress?.state || ''} {selectedOrder.shippingAddress?.zipCode || ''}</p>
                    <p>Phone: {selectedOrder.shippingAddress?.phoneNumber || 'N/A'}</p>
                    <p>Email: {selectedOrder.shippingAddress?.email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Info</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Date: {selectedOrder.createdAt?.seconds ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                    <p>Status: <span className="capitalize font-medium text-foreground">{selectedOrder.status}</span></p>
                    <p>Total: <span className="font-bold text-foreground">₹{selectedOrder.totalAmount}</span></p>
                    <p>Payment Method: <span className="capitalize">{selectedOrder.paymentMethod || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="border rounded-md divide-y mb-6">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p>₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Admin Notes</h3>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border text-sm"
                  placeholder="Add notes about this order..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
                <Button onClick={handleSaveNotes} size="sm">Save Notes</Button>
              </div>

              <div className="flex justify-end pt-4 gap-2 border-t mt-4">
                <Select
                  value={selectedOrder.status}
                  onValueChange={(val) => handleStatusUpdate(selectedOrder.id, val)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placed">Placed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
