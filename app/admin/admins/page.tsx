'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc, where, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Loader2, User, Search, MoreVertical, Shield, Plus, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { hashPassword } from '@/lib/crypto';
import { v4 as uuidv4 } from 'uuid'; // We might need a way to generate IDs if not using Firebase Auth for creation immediately, but usually we should use Firebase Auth. But wait, we can't create secondary firebase auth users easily from client without logging out. 
// Actually, creating a user in Firebase Auth requires Admin SDK or logging out. 
// Since this is a client-side app, we can't easily create another Firebase Auth user without logging out the current Super Admin.
// STRATEGY: We will create a "Shadow User" in Firestore. They won't have a Firebase Auth UID until they log in for the first time? 
// No, the requirement is "create/edit new admins".
// If we can't use Firebase Auth Admin SDK (which runs on server), we have a problem.
// BUT, the prompt says "create a tab called admins... where super admin can create edit new admins".
// AND "Change Password... should work for customer, superadmin and admin roles."
// This implies we are using a custom auth flow or hybrid. 
// Looking at `phone-register.tsx`, we see `createUserWithEmailAndPassword` is NOT used, it uses `signInWithPhoneNumber`. 
// Looking at `phone-login.tsx`, there is `handlePasswordLogin` which verifies password hash against Firestore data.
// This confirms we are using a CUSTOM AUTH system backed by Firestore for password login, alongside Firebase Auth for phone OTP.
// AUTOMATICALLY CONNECTED: So I can just create a document in `users` collection with random ID and the password hash!
// They can then login using Phone+Password (Custom Auth). 
// They WON'T have a Firebase Auth UID initially if they haven't done OTP?
// Wait, `phone-login.tsx` checks `checkUserExists` by querying Firestore.
// So yes, I can just create a Firestore document.

interface UserData {
    id: string;
    username: string;
    displayName: string;
    phone?: string;
    email?: string;
    role: string;
    createdAt: any;
}

export default function AdminsPage() {
    const { user: currentUser } = useAuthStore();
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    const [formData, setFormData] = useState({
        displayName: '',
        phone: '',
        email: '', // Optional
        password: '',
        role: 'admin'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [processing, setProcessing] = useState(false);


    useEffect(() => {
        if (currentUser && currentUser.role !== 'superadmin') {
            router.push('/admin');
            return;
        }
        fetchAdmins();
    }, [currentUser, router]);

    const fetchAdmins = async () => {
        try {
            // Fetch users with role 'admin' or 'superadmin'
            // Firestore doesn't support logical OR in 'where' easily without multiple queries or 'in' (but 'in' is for specific field values).
            // We can use 'in' for role.
            const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'superadmin']));
            const querySnapshot = await getDocs(q);
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as UserData[];

            // Sort manually since we can't orderBy with 'in' easily in client SDK sometimes without index
            usersData.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
                const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching admins:", error);
            toast.error("Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            displayName: '',
            phone: '',
            email: '',
            password: '',
            role: 'admin'
        });
        setShowPassword(false);
    };

    const handleCreate = async () => {
        // Validate
        if (!formData.displayName || !formData.phone || !formData.password) {
            toast.error("Please fill all required fields");
            return;
        }
        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setProcessing(true);
        try {
            // Normalize phone
            const digits = formData.phone.replace(/\D/g, '');
            const normalizedPhone = `+91${digits.slice(-10)}`; // Assuming India context as per project

            // Unique check
            // Check against normalized form and other common forms just in case
            const candidates = [normalizedPhone, digits.slice(-10), digits];

            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phone', 'in', candidates));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast.error("User with this phone number already exists");
                setProcessing(false);
                return;
            }

            // Create
            const newId = uuidv4();
            const hashedPassword = await hashPassword(formData.password);

            const newUser = {
                uid: newId,
                displayName: formData.displayName,
                phone: normalizedPhone, // Save normalized
                email: formData.email,
                role: formData.role,
                password: hashedPassword,
                createdAt: serverTimestamp(),
                username: normalizedPhone // Fallback
            };

            await setDoc(doc(db, 'users', newId), newUser);

            toast.success("Admin created successfully");
            setIsCreateDialogOpen(false);
            resetForm();
            fetchAdmins();

        } catch (error) {
            console.error("Error creating admin:", error);
            toast.error("Failed to create admin");
        } finally {
            setProcessing(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedUser) return;
        if (!formData.displayName) {
            toast.error("Name is required");
            return;
        }

        setProcessing(true);
        try {
            // If phone changed, check uniqueness? 
            // For now, let's assume specific fields are editable. 
            // Usually changing phone number is sensitive. Let's allow Name and Role.
            // And Password if provided.

            const updates: any = {
                displayName: formData.displayName,
                role: formData.role,
                email: formData.email
            };

            // If phone changed, check uniqueness
            if (formData.phone !== selectedUser.phone && formData.phone) {
                const digits = formData.phone.replace(/\D/g, '');
                const normalizedPhone = `+91${digits.slice(-10)}`;

                const candidates = [normalizedPhone, digits.slice(-10), digits];
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('phone', 'in', candidates));
                const querySnapshot = await getDocs(q);

                // Filter out self
                const others = querySnapshot.docs.filter(d => d.id !== selectedUser.id);
                if (others.length > 0) {
                    toast.error("Phone number already in use");
                    setProcessing(false);
                    return;
                }
                updates.phone = normalizedPhone;
                updates.username = normalizedPhone;
            }

            if (formData.password) {
                if (formData.password.length < 6) {
                    toast.error("Password too short");
                    setProcessing(false);
                    return;
                }
                updates.password = await hashPassword(formData.password);
            }

            await updateDoc(doc(db, 'users', selectedUser.id), updates);

            toast.success("Admin updated successfully");
            setIsEditDialogOpen(false);
            fetchAdmins();
        } catch (error) {
            console.error("Error updating admin:", error);
            toast.error("Failed to update admin");
        } finally {
            setProcessing(false);
        }
    };

    const openEditDialog = (user: UserData) => {
        setSelectedUser(user);
        setFormData({
            displayName: user.displayName || '',
            phone: user.phone || '',
            email: user.email || '',
            password: '',
            role: user.role
        });
        setIsEditDialogOpen(true);
    };


    const filteredUsers = users.filter(user =>
        (user.displayName?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (user.phone || '').includes(search)
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Admins</h1>
                    <p className="text-muted-foreground">Manage super admins and admins</p>
                </div>
                <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Admin
                </Button>
            </div>

            <Card className="p-6 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 max-w-md"
                    />
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary text-secondary-foreground">
                            <tr>
                                <th className="px-6 py-3 font-semibold">User</th>
                                <th className="px-6 py-3 font-semibold">Phone</th>
                                <th className="px-6 py-3 font-semibold">Role</th>
                                <th className="px-6 py-3 font-semibold">Joined</th>
                                <th className="px-6 py-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-secondary/50 transition-colors">
                                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User className="w-4 h-4" />
                                        </div>
                                        {user.displayName || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                                            'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Edit Details
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No admins found.
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
                                {/* Simplified pagination logic */}
                                <PaginationItem>
                                    <span className="px-4">Page {currentPage} of {totalPages}</span>
                                </PaginationItem>
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

            {/* CREATE DIALOG */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Admin</DialogTitle>
                        <DialogDescription>
                            Add a new administrator to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label>Full Name</label>
                            <Input
                                value={formData.displayName}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label>Phone Number</label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                placeholder="10 digit number"
                                maxLength={10}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label>Email (Optional)</label>
                            <Input
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                type="email"
                            />
                        </div>
                        <div className="grid gap-2 relative">
                            <label>Password</label>
                            <Input
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                type={showPassword ? "text" : "password"}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 bottom-0.5"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            <label>Role</label>
                            <Select
                                value={formData.role}
                                onValueChange={v => setFormData({ ...formData, role: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Admin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EDIT DIALOG */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Admin</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label>Full Name</label>
                            <Input
                                value={formData.displayName}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label>Phone Number</label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                maxLength={10}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label>Email</label>
                            <Input
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2 relative">
                            <label>New Password (Leave blank to keep)</label>
                            <Input
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 bottom-0.5"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            <label>Role</label>
                            <Select
                                value={formData.role}
                                onValueChange={v => setFormData({ ...formData, role: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Admin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
