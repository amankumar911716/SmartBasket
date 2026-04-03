/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CATEGORY_ICONS } from '@/types';
import type { Address, DeliverySlot } from '@/types';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  CheckCircle2,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SLOTS: DeliverySlot[] = [
  { id: '1', label: 'Today, 6-8 PM', date: 'Today', time: '6:00 PM - 8:00 PM', available: true, fee: 0 },
  { id: '2', label: 'Today, 8-10 PM', date: 'Today', time: '8:00 PM - 10:00 PM', available: true, fee: 0 },
  { id: '3', label: 'Tomorrow, 10 AM-12 PM', date: 'Tomorrow', time: '10:00 AM - 12:00 PM', available: true, fee: 0 },
  { id: '4', label: 'Tomorrow, 12-2 PM', date: 'Tomorrow', time: '12:00 PM - 2:00 PM', available: true, fee: 0 },
  { id: '5', label: 'Tomorrow, 2-4 PM', date: 'Tomorrow', time: '2:00 PM - 4:00 PM', available: true, fee: 0 },
  { id: '6', label: 'Tomorrow, 6-8 PM', date: 'Tomorrow', time: '6:00 PM - 8:00 PM', available: true, fee: 0 },
];

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI', icon: Smartphone, desc: 'Pay using UPI apps' },
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, Rupay' },
  { value: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when delivered' },
];

export default function CheckoutPage() {
  const {
    cartItems,
    getCartTotal,
    getCartMrpTotal,
    couponDiscount,
    appliedCoupon,
    clearCart,
    clearCoupon,
    selectedAddress,
    setSelectedAddress,
    selectedSlot,
    setSelectedSlot,
    navigate,
    goBack,
    user,
    isAuthenticated,
  } = useStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [newAddress, setNewAddress] = useState({
    label: 'Home', fullName: user?.name || '', address: '', city: '', state: '', pincode: '', phone: user?.phone || '', isDefault: false,
  });
  const [showAddAddress, setShowAddAddress] = useState(false);

  const total = getCartTotal();
  const mrpTotal = getCartMrpTotal();
  const deliveryFee = total >= 500 ? 0 : 40;
  const grandTotal = total - couponDiscount + deliveryFee;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('login');
      toast({ title: 'Please login first', description: 'You need to be logged in to place an order', variant: 'destructive' });
      return;
    }
    // Fetch addresses (mock if none)
    fetch('/api/auth')
      .then((r) => r.json())
      .then(() => {})
      .catch(() => {});

    // Set default addresses for demo
    const demoAddresses: Address[] = [
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
    ];
    setAddresses(demoAddresses);
    setSelectedAddress(demoAddresses[0]);
    setSelectedSlot(SLOTS[0]);
  }, []);

  const handleAddNewAddress = () => {
    if (!newAddress.address || !newAddress.city || !newAddress.pincode) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const addr: Address = {
      id: `addr-${Date.now()}`,
      userId: user?.id || '',
      ...newAddress,
    };
    setAddresses((prev) => [...prev, addr]);
    setSelectedAddress(addr);
    setShowAddAddress(false);
    toast({ title: 'Address added' });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({ title: 'Select address', description: 'Please select a delivery address', variant: 'destructive' });
      return;
    }
    if (!selectedSlot) {
      toast({ title: 'Select slot', description: 'Please select a delivery time slot', variant: 'destructive' });
      return;
    }

    setPlacing(true);
    try {
      const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        productName: item.product?.name || 'Product',
        productImage: item.product?.image || '',
        quantity: item.quantity,
        price: item.product?.price || 0,
        total: (item.product?.price || 0) * item.quantity,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          addressId: selectedAddress.id,
          items: orderItems,
          total: grandTotal,
          discount: mrpTotal - total + couponDiscount,
          deliveryFee,
          paymentMethod,
          deliverySlot: selectedSlot.label,
          deliveryDate: selectedSlot.date,
          couponCode: appliedCoupon?.code,
          notes: '',
        }),
      });

      const data = await res.json();
      if (data.id) {
        setOrderId(data.id);
        setShowSuccess(true);
        clearCart();
        clearCoupon();
      } else {
        toast({ title: 'Order failed', description: data.error || 'Failed to place order', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to place order', variant: 'destructive' });
    }
    setPlacing(false);
  };

  const getCategoryEmoji = (catSlug?: string) => CATEGORY_ICONS[catSlug || ''] || '📦';

  if (cartItems.length === 0 && !showSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="size-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-600 mb-2">Your cart is empty</h2>
        <Button onClick={() => navigate('products')} className="bg-green-600 hover:bg-green-700 mt-4">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="size-4" /> Back to Cart
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="size-4 text-green-600" />
                Delivery Address
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowAddAddress(!showAddAddress)}>
                + Add New
              </Button>
            </div>

            {showAddAddress && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Full Name</label>
                    <Input value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
                    <Input value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Address</label>
                  <Input value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">City</label>
                    <Input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">State</label>
                    <Input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Pincode</label>
                    <Input value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddNewAddress} size="sm" className="bg-green-600 hover:bg-green-700">Save Address</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddAddress(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <RadioGroup value={selectedAddress?.id || ''} onValueChange={(val) => {
              const addr = addresses.find((a) => a.id === val);
              if (addr) setSelectedAddress(addr);
            }}>
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAddress?.id === addr.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <RadioGroupItem value={addr.id} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{addr.fullName}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{addr.label}</span>
                      {addr.isDefault && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Default</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{addr.address}</p>
                    <p className="text-xs text-gray-400">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-xs text-gray-400">Phone: {addr.phone}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Delivery Slot */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Calendar className="size-4 text-green-600" />
              Delivery Time Slot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedSlot?.id === slot.id
                      ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!slot.available}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{slot.date}</p>
                      <p className="text-xs text-gray-500">{slot.time}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
              <CreditCard className="size-4 text-green-600" />
              Payment Method
            </h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <label key={method.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === method.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <RadioGroupItem value={method.value} />
                    <Icon className="size-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{method.label}</p>
                      <p className="text-xs text-gray-400">{method.desc}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xl">{getCategoryEmoji(item.product?.category?.slug)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 line-clamp-1">{item.product?.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-800 shrink-0">
                    ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{mrpTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{(mrpTotal - total + couponDiscount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-green-600 font-medium">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-gray-800 pt-1">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddress}
              className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl text-base font-semibold mt-5"
            >
              {placing ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Order...
                </span>
              ) : (
                <>
                  <Truck className="size-4" />
                  Place Order - ₹{grandTotal.toFixed(2)}
                </>
              )}
            </Button>

            {paymentMethod === 'cod' && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Cash payment of ₹{grandTotal.toFixed(2)} at delivery
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-4">
            <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
            <DialogHeader>
              <DialogTitle className="text-xl">Order Placed Successfully! 🎉</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-2">
                Your order #{orderId.slice(-8).toUpperCase()} has been placed successfully.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600">
                <strong>Delivery:</strong> {selectedSlot?.label}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Payment:</strong> {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' : 'Card'}
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <Button
                onClick={() => { setShowSuccess(false); navigate('orders'); }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View My Orders
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowSuccess(false); navigate('home'); }}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
