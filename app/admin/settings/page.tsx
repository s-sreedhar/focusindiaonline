'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Times Book Stall',
    siteUrl: 'https://timesbookstall.com',
    email: 'support@timesbookstall.com',
    phone: '+919959594444',
    shippingCharges: 50,
    freeShippingThreshold: 500,
    currency: 'INR',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage site configuration</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Site Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Site Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Site Name</label>
              <Input
                name="siteName"
                value={settings.siteName}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Site URL</label>
              <Input
                name="siteUrl"
                value={settings.siteUrl}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  name="email"
                  value={settings.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  name="phone"
                  value={settings.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Shipping Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Shipping Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Standard Shipping Charge (₹)</label>
              <Input
                type="number"
                name="shippingCharges"
                value={settings.shippingCharges}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Free Shipping Threshold (₹)</label>
              <Input
                type="number"
                name="freeShippingThreshold"
                value={settings.freeShippingThreshold}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Currency</label>
              <Input
                name="currency"
                value={settings.currency}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button size="lg" onClick={handleSave}>Save Settings</Button>
          <Button variant="outline" size="lg">Reset</Button>
        </div>
      </div>
    </div>
  );
}
