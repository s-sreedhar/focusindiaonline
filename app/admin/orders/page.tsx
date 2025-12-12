'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { Loader2, Package, MoreHorizontal, Filter } from 'lucide-react';
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
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setAdminNotes('');
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
                    <div className="font-medium">{order.shippingAddress?.fullName || 'Guest'}</div>
                    <div className="text-xs text-muted-foreground">{order.shippingAddress?.phoneNumber || 'N/A'}</div>
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
                      <MoreHorizontal className="w-4 h-4" />
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          {selectedOrder && (
            <>
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                      Order #{selectedOrder.orderId || selectedOrder.id.slice(0, 8)}
                      <Badge className={cn("text-sm px-3 capitalize", getStatusColor(selectedOrder.status))}>
                        {selectedOrder.status}
                      </Badge>
                    </DialogTitle>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      Placed on {selectedOrder.createdAt?.seconds ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Customer Info */}
                  <Card className="p-4 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2 text-primary">
                      <User className="w-5 h-5" />
                      Customer & Shipping
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {selectedOrder.shippingAddress?.fullName?.slice(0, 2).toUpperCase() || 'GU'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-base">{selectedOrder.shippingAddress?.fullName || 'Guest User'}</p>
                          <p className="text-muted-foreground">{selectedOrder.shippingAddress?.email}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex gap-2 items-start text-muted-foreground">
                        <Phone className="w-4 h-4 mt-0.5 text-foreground/70" />
                        <span className="text-foreground">{selectedOrder.shippingAddress?.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2 items-start text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 text-foreground/70" />
                        <div className="text-foreground">
                          <p>{selectedOrder.shippingAddress?.street}</p>
                          <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Order Summary */}
                  <Card className="p-4 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2 text-primary">
                      <CreditCard className="w-5 h-5" />
                      Payment & Summary
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-medium capitalize badge badge-outline">{selectedOrder.paymentMethod || 'Online'}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{(selectedOrder as any).subtotal || 0}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>₹{(selectedOrder as any).shippingCharges || 0}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-green-600 font-medium">-₹{(selectedOrder as any).discount || 0}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1 font-bold text-lg text-primary">
                        <span>Total</span>
                        <span>₹{selectedOrder.totalAmount}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <PackageIcon className="w-5 h-5 text-primary" />
                    Order Items
                  </h3>
                  <div className="border rounded-md overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[50%]">Item Details</TableHead>
                          <TableHead className="text-center">Price</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">ID: {item.bookId?.slice(0, 8) || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="text-center">₹{item.price}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-mono">{item.quantity}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{item.price * item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Notes & Activity
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4 border shadow-inner">
                    <ScrollArea className="h-[200px] w-full pr-4">
                      {selectedOrder.notesHistory && selectedOrder.notesHistory.length > 0 ? (
                        <div className="space-y-4">
                          {[...selectedOrder.notesHistory].reverse().map((note, idx) => (
                            <div key={idx} className="flex gap-3 items-start group">
                              <Avatar className="h-8 w-8 border bg-background mt-1">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {(note.adminName || 'AD').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground/80">{note.adminName || 'Admin'}</span>
                                  <span className="text-[10px] text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="text-sm bg-background border p-3 rounded-md rounded-tl-none shadow-sm text-foreground/90 leading-relaxed">
                                  {note.content}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-8">
                          <FileText className="w-8 h-8 opacity-20" />
                          <p className="text-sm">No notes added yet.</p>
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2 pt-2 border-t">
                      <textarea
                        className="flex-1 min-h-[44px] max-h-[120px] p-3 rounded-md border text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                        placeholder="Type an internal note to track progress..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                      />
                      <Button onClick={handleSaveNotes} size="sm" className="h-auto px-4 self-end">Post Note</Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  Action required? Update status below.
                </div>
                <div className="flex gap-3">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(val) => handleStatusUpdate(selectedOrder.id, val)}
                  >
                    <SelectTrigger className="w-[200px] bg-background border-primary/20 hover:border-primary/50 transition-colors">
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
