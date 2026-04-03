/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Order, PaginatedResponse } from '@/types';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  ALL_ORDER_STATUSES,
  getAutoPaymentStatus,
  formatFullDate,
} from '@/types';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
  CreditCard as CardIcon,
  Building2,
  ArrowRightLeft,
  CheckCircle2,
  Undo2,
  Info,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

function getPaymentIcon(method: string) {
  switch (method) {
    case 'upi': return <Smartphone className="size-3.5" />;
    case 'card': return <CardIcon className="size-3.5" />;
    case 'cod': return <Banknote className="size-3.5" />;
    case 'netbanking': return <Building2 className="size-3.5" />;
    default: return <CreditCard className="size-3.5" />;
  }
}

function PaymentStatusBadge({ status, animated }: { status: string; animated?: boolean }) {
  const label = PAYMENT_STATUS_LABELS[status] || status || 'Pending';
  const color = PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.pending;
  return (
    <Badge className={`text-[10px] border-0 ${color} ${animated ? 'animate-pulse ring-2 ring-offset-1 ring-orange-300' : ''}`}>
      {label}
    </Badge>
  );
}

function getPaymentChangeReason(orderStatus: string, paymentMethod: string): string {
  switch (orderStatus) {
    case 'delivered':
      return paymentMethod === 'cod'
        ? 'Payment collected on delivery (COD)'
        : 'Order delivered — payment confirmed';
    case 'cancelled':
      return paymentMethod === 'cod'
        ? 'COD order cancelled — no payment to collect'
        : 'Prepaid order cancelled — refund initiated';
    case 'rejected':
      return paymentMethod === 'cod'
        ? 'COD order rejected — no payment to collect'
        : 'Prepaid order rejected — refund initiated';
    case 'returned':
      return 'Order returned — full refund initiated';
    default:
      return 'Payment status updated automatically';
  }
}

function PaymentSyncToast({
  orderStatus,
  paymentMethod,
  newPaymentStatus,
}: {
  orderStatus: string;
  paymentMethod: string;
  newPaymentStatus: string;
}) {
  const reason = getPaymentChangeReason(orderStatus, paymentMethod);
  const isRefund = newPaymentStatus === 'refunded';
  const isPaid = newPaymentStatus === 'paid';

  return (
    <div className="flex items-start gap-3 py-1">
      <div className={`shrink-0 mt-0.5 ${isRefund ? 'text-orange-500' : isPaid ? 'text-green-500' : 'text-amber-500'}`}>
        {isRefund ? <Undo2 className="size-4" /> : isPaid ? <CheckCircle2 className="size-4" /> : <ArrowRightLeft className="size-4" />}
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-gray-800">
          Payment → <span className={isRefund ? 'text-orange-600' : isPaid ? 'text-green-600' : 'text-amber-600'}>
            {PAYMENT_STATUS_LABELS[newPaymentStatus] || newPaymentStatus}
          </span>
        </p>
        <p className="text-xs text-gray-500">{reason}</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function AdminOrderManager() {
  const { selectOrder, navigate } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch(`/api/orders?page=${page}&limit=15`)
      .then((res) => res.json())
      .then((data: PaginatedResponse<Order>) => {
        setOrders(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewOrder = (orderId: string) => {
    selectOrder(orderId);
    navigate('order-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.id) {
        // Check if payment was auto-updated by backend
        const paymentAutoUpdated = data.paymentAutoUpdated === true;
        const newPaymentStatus = data.newPaymentStatus || data.paymentStatus;

        // Update BOTH orderStatus and paymentStatus in local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  orderStatus: newStatus,
                  paymentStatus: paymentAutoUpdated ? newPaymentStatus : o.paymentStatus,
                }
              : o
          )
        );

        if (paymentAutoUpdated && newPaymentStatus) {
          toast({
            title: `Order: ${ORDER_STATUS_LABELS[newStatus] || newStatus}`,
            description: (
              <PaymentSyncToast
                orderStatus={newStatus}
                paymentMethod={data.paymentMethod || ''}
                newPaymentStatus={newPaymentStatus}
              />
            ),
            duration: 5000,
          });
        } else {
          toast({
            title: 'Status updated',
            description: `Order status changed to ${ORDER_STATUS_LABELS[newStatus] || newStatus}`,
          });
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
    setUpdatingStatus(null);
  };

  const adminStatusOptions = ALL_ORDER_STATUSES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">{orders.length} orders</p>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg border">
            <ArrowRightLeft className="size-3" />
            <span>Payment auto-syncs with order status</span>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="size-3" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs w-8"></TableHead>
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Items</TableHead>
                  <TableHead className="text-xs">Total</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Update Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isUpdating = updatingStatus === order.id;
                  const itemCount = order.items?.length || 0;
                  const autoPayPreview = getAutoPaymentStatus(order.orderStatus, order.paymentMethod);
                  const willChange = !!autoPayPreview && autoPayPreview !== order.paymentStatus;

                  return (
                    <React.Fragment key={order.id}>
                      <TableRow className={isUpdating ? 'bg-amber-50/50' : ''}>
                        <TableCell>
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedOrder === order.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-800">
                            {order.orderId || `#${order.id.slice(-8).toUpperCase()}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatFullDate(order.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-600">{itemCount} items</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-gray-800">
                            ₹{(order.total ?? 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {getPaymentIcon(order.paymentMethod)}
                              <span className="text-xs text-gray-600">
                                {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <PaymentStatusBadge status={order.paymentStatus} animated={isUpdating && willChange} />
                              {isUpdating && (
                                <span className="size-3.5 animate-spin">
                                  <RefreshCw className="size-3.5 text-gray-400" />
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${ORDER_STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'} text-[10px] border-0`}>
                            {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.orderStatus}
                            onValueChange={(val) => handleStatusChange(order.id, val)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                              {isUpdating ? (
                                <span className="flex items-center gap-1.5">
                                  <RefreshCw className="size-3 animate-spin" />
                                  Updating...
                                </span>
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {adminStatusOptions.map((status) => {
                                const preview = getAutoPaymentStatus(status, order.paymentMethod);
                                const changes = !!preview && preview !== order.paymentStatus;
                                return (
                                  <SelectItem key={status} value={status} className="text-xs py-2">
                                    <div className="flex items-center gap-2">
                                      <span>{ORDER_STATUS_LABELS[status] || status}</span>
                                      {changes && (
                                        <span className="flex items-center gap-0.5 text-[10px] text-orange-500 ml-1">
                                          <ArrowRightLeft className="size-2.5" />
                                          {PAYMENT_STATUS_LABELS[preview]}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                          >
                            <Eye className="size-3" /> View
                          </button>
                        </TableCell>
                      </TableRow>
                      {expandedOrder === order.id && order.items && (
                        <TableRow key={`${order.id}-detail`}>
                          <TableCell colSpan={9} className="bg-gray-50 px-6 py-4">
                            <div className="space-y-4">
                              {/* Payment Info Section — synced */}
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                                <CreditCard className="size-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex flex-col gap-1 flex-1">
                                  <p className="text-xs font-semibold text-gray-700">Payment Info</p>
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <div>
                                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Method</span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {getPaymentIcon(order.paymentMethod)}
                                        <p className="text-sm text-gray-800">
                                          {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200" />
                                    <div>
                                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Status</span>
                                      <div className="mt-0.5 flex items-center gap-1.5">
                                        <PaymentStatusBadge status={order.paymentStatus} />
                                        {willChange && (
                                          <span className="flex items-center gap-1 text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                                            <ArrowRightLeft className="size-2.5" />
                                            Auto-syncs
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Order Items */}
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Order Items:</p>
                                {order.items.map((item, idx) => {
                                  const itemName = item.productName || (item as Record<string, unknown>).name || 'Unknown';
                                  const itemImage = item.productImage || (item as Record<string, unknown>).image || '';
                                  const qty = item.quantity || 0;
                                  const price = Number(item.price) || 0;
                                  const total = Number(item.total) || (qty * price);
                                  return (
                                    <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                                      <div className="flex items-center gap-2">
                                        {itemImage ? (
                                          <img src={itemImage} alt="" className="size-8 rounded-md object-cover border" />
                                        ) : (
                                          <Package className="size-4 text-gray-300" />
                                        )}
                                        <div>
                                          <p className="text-gray-800">{itemName}</p>
                                          <p className="text-xs text-gray-400">Qty: {qty} × ₹{price.toFixed(2)}</p>
                                        </div>
                                      </div>
                                      <span className="font-medium text-gray-800">₹{total.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Delivery & Fee Info */}
                              <div className="flex justify-between pt-2 text-xs text-gray-500">
                                <span>Delivery: {order.deliverySlot || 'Not specified'}</span>
                                <span>Discount: ₹{(order.discount ?? 0).toFixed(2)}</span>
                                <span>Delivery Fee: {(order.deliveryFee ?? 0) === 0 ? 'FREE' : `₹${(order.deliveryFee ?? 0).toFixed(2)}`}</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-xs text-gray-500 px-2">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
