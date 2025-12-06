'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Trash2, Edit2, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';



export default function AddressesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
            <Link href="/account" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Account
            </Link>
          </Button>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Saved Addresses</h1>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <Card className="p-6 mb-8">
              <h2 className="text-lg font-bold mb-4">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Address Name (e.g., Home, Office)" />
                  <Input placeholder="Phone Number" />
                </div>
                <Input placeholder="Street Address" />
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="City" />
                  <Input placeholder="State" />
                  <Input placeholder="ZIP Code" />
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1">Save Address</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Address List */}
          <div className="space-y-4">
            {user?.address ? (
              <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Default Address</h3>
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Default Address
                    </span>
                  </div>
                  {/* Edit button could go here */}
                </div>

                <p className="text-sm text-muted-foreground mb-2">{user.address.street}</p>
                <p className="text-sm text-muted-foreground">
                  {user.address.city}, {user.address.state} {user.address.zipCode}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{user.phone}</p>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No address saved yet</p>
                <Button onClick={() => setShowForm(true)}>Add Address</Button>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
