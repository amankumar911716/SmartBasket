'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  MapPin,
  Plus,
  Trash2,
  ArrowLeft,
  Edit2,
  Star,
  Check,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Address } from '@/types';

export default function AddressesPage() {
  const { user, goBack } = useStore();
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 'addr-1', userId: user?.id || '', label: 'Home', fullName: user?.name || 'User',
      address: '123, Green Street, Apartment 4B', city: 'Bangalore', state: 'Karnataka',
      pincode: '560001', phone: user?.phone || '9876543210', isDefault: true,
    },
    {
      id: 'addr-2', userId: user?.id || '', label: 'Office', fullName: user?.name || 'User',
      address: '456, Tech Park, Whitefield', city: 'Bangalore', state: 'Karnataka',
      pincode: '560066', phone: user?.phone || '9876543210', isDefault: false,
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState({
    label: 'Home', fullName: '', address: '', city: '', state: '', pincode: '', phone: '',
  });

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone,
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setForm({ label: 'Home', fullName: user?.name || '', address: '', city: '', state: '', pincode: '', phone: user?.phone || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.fullName || !form.address || !form.city || !form.pincode || !form.phone) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    if (editingAddress) {
      setAddresses((prev) => prev.map((a) =>
        a.id === editingAddress.id ? { ...a, ...form } : a
      ));
      toast({ title: 'Address updated' });
    } else {
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        userId: user?.id || '',
        ...form,
        isDefault: addresses.length === 0,
      };
      setAddresses((prev) => [...prev, newAddr]);
      toast({ title: 'Address added' });
    }
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast({ title: 'Address deleted' });
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({
      ...a,
      isDefault: a.id === id,
    })));
    toast({ title: 'Default address updated' });
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Addresses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your delivery addresses</p>
        </div>
        <Button onClick={handleAddNew} size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="size-4" /> Add New
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="py-4 mb-6 border-green-200 bg-green-50/30">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-base font-bold text-gray-800">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Label</label>
                <select
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full h-9 text-sm border rounded-lg px-3 bg-white"
                >
                  <option>Home</option>
                  <option>Office</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Full Name</label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Address</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">City</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">State</label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Pincode</label>
                <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                {editingAddress ? 'Update Address' : 'Save Address'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingAddress(null); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MapPin className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No addresses saved yet</p>
          <Button onClick={handleAddNew} size="sm" className="mt-3 bg-green-600 hover:bg-green-700">
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className="py-4">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="size-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{addr.fullName}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{addr.label}</span>
                        {addr.isDefault && (
                          <Badge className="bg-green-100 text-green-700 text-[10px] border-0 flex items-center gap-0.5">
                            <Star className="size-2.5" /> Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{addr.address}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-gray-400">Phone: {addr.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Set as default"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(addr)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
