/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Order } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_STEPS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, getAutoPaymentStatus } from '@/types';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Package,
  CheckCircle2,
  Truck,
  ShoppingBag,
  XCircle,
  Phone,
  User,
  ArrowRightLeft,
  Banknote,
  Smartphone,
  Building2,
  Undo2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function OrderDetail() {
  const { selectedOrderId, goBack, user, navigate, setAdminTab } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchOrder = () => {
    if (!selectedOrderId) return;
    setLoading(true);
    fetch(`/api/orders/${selectedOrderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) setOrder(data);
        else setOrder(null);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [selectedOrderId]);

  const handleBack = () => {
    // If admin was viewing from admin orders, ensure we go back to the orders tab
    if (user?.role === 'admin') {
      setAdminTab('orders');
    }
    goBack();
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (data.id) {
        setOrder(data);
        const paymentAutoUpdated = data.paymentAutoUpdated === true;
        const newPayStatus = data.newPaymentStatus || data.paymentStatus;
        if (paymentAutoUpdated && newPayStatus) {
          toast({
            title: 'Order cancelled',
            description: `Payment status auto-updated to "${PAYMENT_STATUS_LABELS[newPayStatus] || newPayStatus}"`,
          });
        } else {
          toast({ title: 'Order cancelled', description: 'Your order has been cancelled successfully' });
        }
        setShowCancelDialog(false);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to cancel order', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel order', variant: 'destructive' });
    }
    setCancelling(false);
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    const idx = ORDER_STATUS_STEPS.indexOf(order.orderStatus);
    return idx;
  };

  const isCancellable = order && ['placed', 'confirmed'].includes(order.orderStatus);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-48 rounded-xl mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Package className="size-16 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500">Order not found</p>
        <Button
          variant="outline"
          onClick={handleBack}
          className="mt-4 gap-2 group hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all duration-200"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back Navigation Button */}
      <Button
        variant="outline"
        onClick={handleBack}
        className="mb-5 group gap-2 text-sm font-medium hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all duration-200 active:scale-[0.97]"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
        <span className="hidden sm:inline">Back to Orders</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Order {order.orderId || `#${order.id.slice(-8).toUpperCase()}`}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <Badge className={`${ORDER_STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'} text-sm px-3 py-1 border-0 self-start`}>
          {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
        </Badge>
      </div>

      {/* Status Tracker */}
      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' && (
        <div className="bg-white rounded-xl border p-5 sm:p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-5">Order Status</h3>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(currentStep / (ORDER_STATUS_STEPS.length - 1)) * 100}%` }}
              />
            </div>
            {ORDER_STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                    {isCompleted ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <p className={`text-[10px] sm:text-xs mt-2 text-center max-w-[70px] ${
                    isCompleted ? 'text-green-700 font-medium' : 'text-gray-400'
                  }`}>
                    {ORDER_STATUS_LABELS[step]?.split(' ').slice(-1)[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.orderStatus === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex items-center gap-3">
          <XCircle className="size-6 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Order Cancelled</p>
            <p className="text-xs text-red-500">This order has been cancelled. Refund will be processed within 5-7 business days.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="size-4 text-green-600" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => {
                const name = item.productName || (item as Record<string, unknown>).name || 'Unknown Item';
                const image = item.productImage || (item as Record<string, unknown>).image || '';
                const qty = item.quantity || 0;
                const price = Number(item.price) || 0;
                const total = Number(item.total) || (qty * price);

                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shrink-0 border overflow-hidden">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.nextElementSibling) {
                              (target.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <Package className="size-6 text-gray-300" style={{ display: image ? 'none' : 'flex' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{name}</p>
                      <p className="text-xs text-gray-400">Qty: {qty} × ₹{price.toFixed(2)}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-800 shrink-0">₹{total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Cancel button */}
            {isCancellable && (
              <div className="mt-5 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  className="text-sm"
                >
                  Cancel Order
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Order Info Sidebar */}
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{((order.total ?? 0) + (order.discount ?? 0) - (order.deliveryFee ?? 0)).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{(order.discount ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className={order.deliveryFee === 0 ? 'text-green-600' : ''}>
                  {(order.deliveryFee ?? 0) === 0 ? 'FREE' : `₹${(order.deliveryFee ?? 0).toFixed(2)}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-gray-800">
                <span>Total</span>
                <span>₹{(order.total ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Truck className="size-4 text-green-600" />
              Delivery Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-800">{order.address?.fullName}</p>
                  <p className="text-gray-500 text-xs">{order.address?.address}</p>
                  <p className="text-gray-400 text-xs">{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">{order.deliveryDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">{order.deliverySlot}</span>
              </div>
              {order.address?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">{order.address.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info — synced with order status */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard className="size-4 text-green-600" />
              Payment Info
              {(() => {
                const autoPay = getAutoPaymentStatus(order.orderStatus, order.paymentMethod);
                const willChange = autoPay && autoPay !== order.paymentStatus;
                return willChange ? (
                  <span className="ml-auto text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                    <ArrowRightLeft className="size-2.5" />
                    Auto-syncs
                  </span>
                ) : null;
              })()}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Method</span>
                <div className="flex items-center gap-1.5">
                  {order.paymentMethod === 'upi' && <Smartphone className="size-3.5 text-gray-400" />}
                  {order.paymentMethod === 'card' && <CreditCard className="size-3.5 text-gray-400" />}
                  {order.paymentMethod === 'cod' && <Banknote className="size-3.5 text-gray-400" />}
                  {order.paymentMethod === 'netbanking' && <Building2 className="size-3.5 text-gray-400" />}
                  <span className="text-gray-800 font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <div className="flex items-center gap-1.5">
                  {order.paymentStatus === 'refunded' && <Undo2 className="size-3 text-orange-500" />}
                  {order.paymentStatus === 'paid' && <CheckCircle2 className="size-3 text-green-500" />}
                  <Badge className={`${PAYMENT_STATUS_COLORS[order.paymentStatus] || PAYMENT_STATUS_COLORS.pending} text-xs border-0`}>
                    {PAYMENT_STATUS_LABELS[order.paymentStatus] || 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {order.orderId || `#${order.id.slice(-8).toUpperCase()}`}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="flex-1"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
            </Button>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
              No, Keep It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
