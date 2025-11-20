'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Trash2, Edit2, Plus } from 'lucide-react';

const mockAddresses = [
  {
    id: '1',
    name: 'Home',
    address: '123 Main St, Apt 4B',
    city: 'Hyderabad',
    state: 'Telangana',
    zipCode: '500001',
    phone: '+919876543210',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Office',
    address: '456 Business Park',
    city: 'Hyderabad',
    state: 'Telangana',
    zipCode: '500032',
    phone: '+919876543211',
    isDefault: false,
  },
];

export default function AddressesPage() {
  const { isAuthenticated } = useAuthStore();
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
      
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
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
            {mockAddresses.map((address) => (
              <Card key={address.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{address.name}</h3>
                    {address.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Default Address
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(address.id);
                        setShowForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-2">{address.address}</p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{address.phone}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
