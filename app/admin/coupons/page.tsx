'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DateTimePicker } from '@/components/datetime-picker';

interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minPurchaseAmount: number;
    expiryDate: string;
    isActive: boolean;
    createdAt: any;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: '',
        minPurchaseAmount: '',
        expiryDate: '',
        isActive: true,
    });

    const fetchCoupons = async () => {
        try {
            const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Coupon[];
            setCoupons(data);
        } catch (error) {
            //console.error('Error fetching coupons:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleSubmit = async () => {
        if (!formData.code || !formData.value || !formData.expiryDate) {
            toast.error('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const couponData = {
                code: formData.code.trim().toUpperCase(),
                type: formData.type,
                value: Number(formData.value),
                minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
                expiryDate: formData.expiryDate,
                isActive: formData.isActive,
            };

            if (editingId) {
                await updateDoc(doc(db, 'coupons', editingId), {
                    ...couponData,
                    updatedAt: serverTimestamp(),
                });
                toast.success('Coupon updated successfully');
            } else {
                await addDoc(collection(db, 'coupons'), {
                    ...couponData,
                    createdAt: serverTimestamp(),
                });
                toast.success('Coupon created successfully');
            }

            setFormData({
                code: '',
                type: 'percentage',
                value: '',
                minPurchaseAmount: '',
                expiryDate: '',
                isActive: true,
            });
            setEditingId(null);
            setIsDialogOpen(false);
            fetchCoupons();
        } catch (error) {
            //console.error('Error saving coupon:', error);
            toast.error('Failed to save coupon');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingId(coupon.id);
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value.toString(),
            minPurchaseAmount: coupon.minPurchaseAmount.toString(),
            expiryDate: coupon.expiryDate,
            isActive: coupon.isActive,
        });
        setIsDialogOpen(true);
    };

    // Confirm Dialog
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteDoc(doc(db, 'coupons', deleteId));
            toast.success('Coupon deleted successfully');
            fetchCoupons();
        } catch (error) {
            //console.error('Error deleting coupon:', error);
            toast.error('Failed to delete coupon');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Coupon"
                description="Are you sure you want to delete this coupon? This action cannot be undone."
                variant="destructive"
            />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
                    <p className="text-muted-foreground">Manage discount coupons for your store.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setFormData({
                            code: '',
                            type: 'percentage',
                            value: '',
                            minPurchaseAmount: '',
                            expiryDate: '',
                            isActive: true,
                        });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Coupon Code</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. SUMMER50"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="value">Value</Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        placeholder="e.g. 10 or 500"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="minAmount">Min Purchase Amount (₹)</Label>
                                <Input
                                    id="minAmount"
                                    type="number"
                                    placeholder="e.g. 1000"
                                    value={formData.minPurchaseAmount}
                                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Expiry Date & Time</Label>
                                <DateTimePicker
                                    date={formData.expiryDate ? new Date(formData.expiryDate) : undefined}
                                    setDate={(date) => setFormData({ ...formData, expiryDate: date ? date.toISOString() : '' })}
                                />
                            </div>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Update Coupon' : 'Create Coupon'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Min Purchase</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : coupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No coupons found. Create some to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-primary" />
                                            {coupon.code}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                                    </TableCell>
                                    <TableCell>₹{coupon.minPurchaseAmount}</TableCell>
                                    <TableCell>{format(new Date(coupon.expiryDate), 'MMM dd, yyyy p')}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.isActive && new Date(coupon.expiryDate) >= new Date()
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {coupon.isActive && new Date(coupon.expiryDate) >= new Date()
                                                ? 'Active'
                                                : 'Expired/Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(coupon.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
