'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  Save,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, updateUser, goBack } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    // Simulate save
    updateUser({ name: name.trim(), phone: phone.trim() });
    toast({ title: 'Profile updated', description: 'Your profile has been saved' });
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="size-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">My Profile</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your account details</p>

      {/* Profile Header */}
      <Card className="py-4 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Badge className={`${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'} text-xs border-0 mt-1`}>
                {user.role === 'admin' ? <><Shield className="size-3 inline mr-1" /> Admin</> : 'Customer'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className="py-4">
        <CardContent className="p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                <User className="size-4" /> Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                <Mail className="size-4" /> Email
              </label>
              <Input
                value={email}
                disabled
                className="h-10 bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                <Phone className="size-4" /> Phone Number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10"
              />
            </div>
            <Separator />
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Saving...' : <><Save className="size-4" /> Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
