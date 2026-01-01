'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { Loader2, Package, Eye, Filter, Mail } from 'lucide-react';
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Phone, MapPin, CreditCard, Calendar, FileText, Package as PackageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
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
      //console.error("Error fetching orders:", error);
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
      //console.error("Error updating status:", error);
      toast.error('Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder || !adminNotes.trim()) return;
    try {
      const newNote = {
        content: adminNotes,
        createdAt: new Date().toISOString(),
        adminName: 'Admin' // You might want to get this from auth store
      };

      const updatedHistory = [...(selectedOrder.notesHistory || []), newNote];

      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        notesHistory: updatedHistory,
        adminNotes: adminNotes // Keep legacy field updated with latest note
      });

      const updatedOrder = {
        ...selectedOrder,
        notesHistory: updatedHistory,
        adminNotes: adminNotes
      };

      // Update list
      setOrders(prev => prev.map(o =>
        o.id === selectedOrder.id ? updatedOrder : o
      ));

      // Update selected order so the change sticks in the UI context
      setSelectedOrder(updatedOrder);
      setAdminNotes(''); // Clear input
      setIsDialogOpen(false); // Close dialog

      toast.success("Note saved successfully");
    } catch (error) {
      //console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setAdminNotes('');
    setIsDialogOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    // Status Filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;

    // Date Filter
    if (dateFilter === 'all') return true;

    if (!order.createdAt || !order.createdAt.seconds) return false;
    const orderDate = new Date(order.createdAt.seconds * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      return orderDate >= today;
    } else if (dateFilter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return orderDate >= startOfWeek;
    } else if (dateFilter === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return orderDate >= startOfMonth;
    }

    return true;
  });

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
      case 'confirmed': return 'bg-sky-100 text-sky-800 hover:bg-sky-100';
      case 'received':
      case 'placed': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'payment_pending': return 'bg-slate-100 text-slate-800 hover:bg-slate-100';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'returned': return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'failed': return 'bg-red-100 text-red-800 hover:bg-red-100';
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
              <SelectItem value="payment_pending">Payment Pending</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="placed">Placed (Legacy)</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(val) => {
            setDateFilter(val);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
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
                <th className="px-6 py-3 font-semibold">Weight</th>
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
                    <div className="font-medium">
                      {order.shippingAddress?.fullName ||
                        (order.shippingAddress?.firstName && order.shippingAddress?.lastName
                          ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                          : 'Guest')}
                    </div>
                    {order.shippingAddress?.email && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {order.shippingAddress.email}
                      </div>
                    )}
                    {(order.shippingAddress?.phoneNumber || (order.shippingAddress as any)?.phone) && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {order.shippingAddress.phoneNumber || (order.shippingAddress as any)?.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {/* Calculate total weight from items if not in order object, but here we can just sum if not persisted or show if persisted */}
                    <span className="text-sm">
                      {(order.items.reduce((sum, item) => sum + ((item as any).weight || 500) * item.quantity, 0) / 1000).toFixed(1)} kg
                    </span>
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
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {selectedOrder && (
            <>
              <DialogHeader className="p-6 pb-4 border-b bg-muted/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <DialogTitle className="text-xl font-bold flex items-center gap-3">
                      Order #{selectedOrder.orderId || selectedOrder.id.slice(0, 8)}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedOrder.createdAt?.seconds ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  {/* Status Actions moved to header for visibility */}
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
                    <span className="text-sm font-medium mr-2">Status:</span>
                    <Badge className={cn("text-xs px-2.5 py-1 capitalize mr-2", getStatusColor(selectedOrder.status))}>
                      {selectedOrder.status}
                    </Badge>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(val) => handleStatusUpdate(selectedOrder.id, val)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="end">
                        <SelectItem value="payment_pending">Payment Pending</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">In Transit (Shipped)</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                  {/* Top Row: Customer and Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 shadow-sm border-l-4 border-l-primary">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">{selectedOrder.shippingAddress?.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{selectedOrder.shippingAddress?.fullName}</p>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>{selectedOrder.shippingAddress?.phoneNumber}</p>
                            <p>{selectedOrder.shippingAddress?.email}</p>
                            <p className="mt-1 text-foreground/80">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zipCode}</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 shadow-sm border-r-4 border-r-green-500">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>₹{(selectedOrder as any).subtotal || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>₹{(selectedOrder as any).shippingCharges || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-1">
                          <span>Total Amount</span>
                          <span className="text-lg">₹{selectedOrder.totalAmount}</span>
                        </div>
                        <div className="text-xs text-right text-muted-foreground">
                          via {selectedOrder.paymentMethod || 'Online'}
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><PackageIcon className="w-4 h-4" /> Order Items</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="py-2">Product</TableHead>
                            <TableHead className="text-center py-2">Qty</TableHead>
                            <TableHead className="text-right py-2">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-3">
                                <div className="font-medium text-sm">{item.title}</div>
                                <div className="text-xs text-muted-foreground">ID: {item.bookId?.slice(0, 6)}...</div>
                              </TableCell>
                              <TableCell className="text-center py-3">{item.quantity}</TableCell>
                              <TableCell className="text-right py-3">₹{item.price * item.quantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Internal Notes
                    </h3>
                    <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {selectedOrder.notesHistory && selectedOrder.notesHistory.length > 0 ? (
                          [...selectedOrder.notesHistory].reverse().map((note, i) => (
                            <div key={i} className="text-sm bg-background p-3 rounded-md border shadow-sm space-y-2">
                              <div className="flex justify-between items-center text-xs text-muted-foreground border-b pb-1">
                                <span className="font-semibold text-primary">{note.adminName || 'Admin'}</span>
                                <span>{new Date(note.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{note.content}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm italic">
                            No internal notes added yet.
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Input
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add a private note..."
                          className="h-9 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveNotes();
                            }
                          }}
                        />
                        <Button size="sm" onClick={handleSaveNotes} disabled={!adminNotes.trim()}>Save</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/10 flex justify-end items-center shrink-0">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
