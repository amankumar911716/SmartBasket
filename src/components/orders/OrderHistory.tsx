/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Order, PaginatedResponse } from '@/types';
import { ORDER_STATUS_LABELS } from '@/types';
import {
  Package,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  placed: <Clock className="size-3.5" />,
  confirmed: <CheckCircle2 className="size-3.5" />,
  packed: <Package className="size-3.5" />,
  in_transit: <Truck className="size-3.5" />,
  delivered: <CheckCircle2 className="size-3.5" />,
  cancelled: <XCircle className="size-3.5" />,
};

export default function OrderHistory() {
  const { navigate, selectOrder, user, isAuthenticated } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('userId', user?.id || '');
    params.set('page', page.toString());
    params.set('limit', '10');
    if (activeTab !== 'all') params.set('status', activeTab);

    fetch(`/api/orders?${params}`)
      .then((res) => res.json())
      .then((data: PaginatedResponse<Order>) => {
        setOrders(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, activeTab, page]);

  const handleOrderClick = (order: Order) => {
    selectOrder(order.id);
    navigate('order-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredOrders = activeTab === 'all' ? orders : orders.filter((o) => o.orderStatus === activeTab);

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">My Orders</h1>
      <p className="text-sm text-gray-500 mb-6">Track and manage your orders</p>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }}>
        <TabsList className="mb-6 overflow-x-auto">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="placed">Placed</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="in_transit">In Transit</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="size-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">No orders found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'all' ? 'You haven\'t placed any orders yet' : `No ${activeTab.replace('_', ' ')} orders`}
            </p>
            <Button
              onClick={() => navigate('products')}
              className="bg-green-600 hover:bg-green-700 mt-4"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="w-full bg-white rounded-xl border p-4 sm:p-5 text-left transition-all hover:shadow-md hover:border-green-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Order {order.orderId || `#${order.id.slice(-8).toUpperCase()}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge className={`${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'} text-xs border-0 flex items-center gap-1`}>
                      {STATUS_ICONS[order.orderStatus]}
                      {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                    {order.items?.slice(0, 4).map((item, idx) => {
                      const img = item.productImage || (item as Record<string, unknown>).image || '';
                      return (
                        <div key={idx} className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden">
                          {img ? (
                            <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="size-5 text-gray-300" />
                          )}
                        </div>
                      );
                    })}
                    {(order.items?.length || 0) > 4 && (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-xs text-gray-500 font-medium">
                        +{(order.items?.length || 0) - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">
                        {(order.items?.length || 0)} {(order.items?.length || 0) === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-base font-bold text-gray-800">₹{(order.total ?? 0).toFixed(2)}</span>
                      <ChevronRight className="size-4 text-gray-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500 px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
