'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";

interface Enquiry {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied';
    createdAt: any;
}

export default function EnquiriesPage() {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

    useEffect(() => {
        fetchEnquiries();
    }, []);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data: Enquiry[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Enquiry);
            });
            setEnquiries(data);
        } catch (error) {
            console.error("Error fetching enquiries:", error);
            toast.error("Failed to load enquiries");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this enquiry?')) return;
        try {
            await deleteDoc(doc(db, 'enquiries', id));
            setEnquiries(prev => prev.filter(e => e.id !== id));
            toast.success('Enquiry deleted');
        } catch (error) {
            console.error("Error deleting enquiry:", error);
            toast.error("Failed to delete enquiry");
        }
    };

    const markAsRead = async (enquiry: Enquiry) => {
        if (enquiry.status === 'read') return;
        try {
            await updateDoc(doc(db, 'enquiries', enquiry.id), { status: 'read' });
            setEnquiries(prev => prev.map(e => e.id === enquiry.id ? { ...e, status: 'read' } : e));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Enquiries</h1>
                    <p className="text-muted-foreground">Manage customer contact requests</p>
                </div>
                <Button onClick={fetchEnquiries} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            <Card className="p-6">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : enquiries.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No enquiries found yet.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enquiries.map((enquiry) => (
                                <TableRow key={enquiry.id} className={enquiry.status === 'new' ? 'bg-muted/30 font-medium' : ''}>
                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                        {formatDate(enquiry.createdAt)}
                                    </TableCell>
                                    <TableCell>{enquiry.name}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={enquiry.subject}>
                                        {enquiry.subject}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs space-y-1">
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {enquiry.email}
                                            </div>
                                            {enquiry.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {enquiry.phone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${enquiry.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                                enquiry.status === 'read' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {enquiry.status.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedEnquiry(enquiry);
                                                            markAsRead(enquiry);
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Enquiry Details</DialogTitle>
                                                        <DialogDescription>
                                                            Received on {formatDate(enquiry.createdAt)}
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="space-y-4 mt-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground block text-xs">Name</span>
                                                                <span className="font-medium">{enquiry.name}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block text-xs">Email</span>
                                                                <span className="font-medium">{enquiry.email}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block text-xs">Phone</span>
                                                                <span className="font-medium">{enquiry.phone || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block text-xs">Status</span>
                                                                <span className="font-medium capitalize">{enquiry.status}</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-muted p-4 rounded-md">
                                                            <span className="text-xs text-muted-foreground block mb-1">Subject</span>
                                                            <h4 className="font-bold mb-2">{enquiry.subject}</h4>
                                                            <div className="text-sm whitespace-pre-wrap">
                                                                {enquiry.message}
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <Button
                                                                variant="outline"
                                                                asChild
                                                                className="flex items-center gap-2"
                                                            >
                                                                <a href={`mailto:${enquiry.email}?subject=Re: ${enquiry.subject}`}>
                                                                    <Mail className="w-4 h-4" /> Reply via Email
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(enquiry.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
