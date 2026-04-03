/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { AdminStats, Product, Category } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatFullDate, formatChartDate } from '@/types';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Plus,
  Trophy,
  BarChart3,
  Check,
  X,
  Loader2,
  Star,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

type DailyRevenueItem = { date: string; dateLabel: string; revenue: number; orders: number };
type TopProductItem = { name: string; image: string; revenue: number; qty: number; productId?: string };

// Color palette for status pie chart
const STATUS_PIE_COLORS = [
  '#f59e0b', '#eab308', '#14b8a6', '#8b5cf6', '#a855f7',
  '#6366f1', '#06b6d4', '#22c55e', '#ef4444', '#f43f5e', '#f97316',
];

interface RevenueTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DailyRevenueItem }>;
  label?: string;
}

function RevenueChartTooltip({ active, payload, label }: RevenueTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="text-gray-500">Revenue:</span>
        <span className="font-bold text-green-600">₹{data.revenue.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <span className="text-gray-500">Orders:</span>
        <span className="font-semibold text-gray-700">{data.orders}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Add Top Product Dialog                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function AddTopProductDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '50');
    if (search) params.set('search', search);
    fetch(`/api/admin/products?${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    if (open) fetchProducts();
  }, [open, fetchProducts]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: true }),
      });
      const data = await res.json();
      if (data.id) {
        toast({ title: 'Added to Featured', description: 'Product has been marked as a top/featured product.' });
        onClose();
        onSaved();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to update', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
    setSaving(false);
  };

  const selected = products.find((p) => p.id === selectedId);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transition-all ${open ? 'scale-100' : 'scale-95'}`}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Add Top Product</h3>
            <p className="text-xs text-gray-400 mt-0.5">Select a product to mark as featured/top seller</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full h-10 pl-4 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-green-500" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No products found</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedId(product.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    selectedId === product.id
                      ? 'bg-green-50 border-2 border-green-500 shadow-sm'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="size-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="size-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <Package className="size-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.brand} · ₹{product.price}</p>
                  </div>
                  {selectedId === product.id && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <Check className="size-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t bg-gray-50 rounded-b-2xl">
          <div className="text-xs text-gray-400">
            {selected && <span>Selected: <strong className="text-gray-700">{selected.name}</strong></span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!selectedId || saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving && <Loader2 className="size-3.5 mr-1 animate-spin" />}
              Add as Featured
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Edit Product Modal                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function EditProductModal({
  open,
  onClose,
  productId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  productId: string | null;
  onSaved: () => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [inStock, setInStock] = useState(true);
  const [stock, setStock] = useState('');

  const fetchData = useCallback(() => {
    if (!productId || !open) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/products/${productId}`).then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([prod, cats]) => {
        const p = prod as Product;
        setProduct(p);
        setName(p.name || '');
        setPrice(String(p.price ?? ''));
        setMrp(String(p.mrp ?? ''));
        setUnit(p.unit || '');
        setCategoryId(p.categoryId || '');
        setBrand(p.brand || '');
        setDescription(p.description || '');
        setImage(p.image || '');
        setInStock(p.inStock !== false);
        setStock(String(p.stock ?? ''));
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load product data.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [productId, open]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!productId) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: 'Name Required', description: 'Product name cannot be empty.', variant: 'destructive' });
      return;
    }
    const priceNum = parseFloat(price);
    const mrpNum = parseFloat(mrp);
    if (isNaN(priceNum) || priceNum < 0) {
      toast({ title: 'Invalid Price', description: 'Please enter a valid selling price.', variant: 'destructive' });
      return;
    }
    if (isNaN(mrpNum) || mrpNum < 0) {
      toast({ title: 'Invalid MRP', description: 'Please enter a valid MRP.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          price: priceNum,
          mrp: mrpNum,
          unit: unit.trim() || undefined,
          categoryId: categoryId || undefined,
          brand: brand.trim() || undefined,
          description: description.trim() || undefined,
          image: image.trim() || undefined,
          inStock,
          stock: stock ? parseInt(stock, 10) : undefined,
        }),
      });
      const data = await res.json();
      if (data.id) {
        toast({ title: 'Product Updated! ✅', description: `"${trimmedName}" has been saved successfully.` });
        onClose();
        onSaved();
      } else {
        toast({ title: 'Update Failed', description: data.error || 'Could not save changes.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg transition-all ${open ? 'scale-100' : 'scale-95'} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Pencil className="size-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Edit Product</h3>
              <p className="text-xs text-gray-400">{product?.name || 'Loading...'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-green-500" />
            </div>
          ) : (
            <>
              {/* Preview image */}
              {image && (
                <div className="flex justify-center">
                  <img src={image} alt="Preview" className="size-20 rounded-xl object-cover border shadow-sm" />
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Product Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Price + MRP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Selling Price ₹ <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">MRP ₹ <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Unit + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="1 kg, 500g, 1 pc..."
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Stock Qty</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min="0"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Amul, Tata, etc."
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Image URL</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Product description..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                />
              </div>

              {/* In Stock toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-sm font-medium text-gray-700">In Stock</span>
                <button
                  type="button"
                  onClick={() => setInStock(!inStock)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${inStock ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${inStock ? 'translate-x-5.5' : 'translate-x-0.5'}`}
                    style={{ transform: inStock ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex items-center justify-end gap-2 p-5 border-t bg-gray-50 rounded-b-2xl shrink-0">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="size-3.5 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Delete Confirmation Dialog                                         */
/* ═══════════════════════════════════════════════════════════════════ */

function DeleteProductDialog({
  open,
  onClose,
  productName,
  productId,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  productName: string;
  productId: string | null;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!productId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Product Deleted', description: `"${productName}" has been permanently removed.` });
        onClose();
        onDeleted();
      } else {
        toast({ title: 'Delete Failed', description: data.error || 'Could not delete product.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    }
    setDeleting(false);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm transition-all ${open ? 'scale-100' : 'scale-95'}`}>
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="size-7 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Product?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Are you sure you want to delete <strong className="text-gray-700">&quot;{productName}&quot;</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center gap-2 p-5 pt-0 justify-center">
          <Button variant="outline" size="sm" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? (
              <>
                <Loader2 className="size-3.5 mr-1 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-3.5 mr-1" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main Admin Dashboard                                               */
/* ═══════════════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const { selectOrder, navigate, setAdminTab } = useStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Edit / Delete modal state
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState('');

  const dailyRevenue: DailyRevenueItem[] = ((stats as any)?.dailyRevenue ?? []) as DailyRevenueItem[];

  const topProducts: TopProductItem[] = (() => {
    const raw = stats?.topProducts;
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((item: any) => ({
      name: item.name || '',
      image: item.image || '',
      revenue: item.revenue || 0,
      qty: item.qty || 0,
      productId: item.productId,
    } satisfies TopProductItem)).filter((p) => p.name);
  })();

  const fetchStats = useCallback(() => {
    setLoading(true);
    fetch('/api/admin')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, setAdminTab]);

  const handleOrderClick = (orderId: string) => {
    selectOrder(orderId);
    navigate('order-detail');
  };

  const handleEditProduct = (product: TopProductItem) => {
    if (product.productId) {
      setEditProductId(product.productId);
    } else {
      setAdminTab('products');
      toast({ title: `Edit: ${product.name}`, description: 'Search for this product in the Products tab to edit.' });
    }
  };

  const handleDeleteProduct = (product: TopProductItem) => {
    if (product.productId) {
      setDeleteProductId(product.productId);
      setDeleteProductName(product.name);
    } else {
      setAdminTab('products');
      toast({ title: `Delete: ${product.name}`, description: 'Search for this product in the Products tab to delete.' });
    }
  };

  const totalPeriodRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const avgDailyRevenue = dailyRevenue.length > 0 ? totalPeriodRevenue / dailyRevenue.length : 0;
  const totalPeriodOrders = dailyRevenue.reduce((s, d) => s + d.orders, 0);
  const last3 = dailyRevenue.slice(-3).reduce((s, d) => s + d.revenue, 0);
  const prev3 = dailyRevenue.slice(0, 4).slice(-3).reduce((s, d) => s + d.revenue, 0);
  const revenueChange = prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : 0;

  const statCards = [
    { label: 'Total Revenue', value: stats ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '₹0', icon: DollarSign, color: 'bg-emerald-50', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'bg-amber-50', iconColor: 'text-amber-600', iconBg: 'bg-amber-100' },
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'bg-cyan-50', iconColor: 'text-cyan-600', iconBg: 'bg-cyan-100' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-violet-50', iconColor: 'text-violet-600', iconBg: 'bg-violet-100' },
  ];

  const statusPieData = (stats?.ordersByStatus || []).map((item, idx) => ({
    name: ORDER_STATUS_LABELS[item.status] || item.status,
    value: item.count,
    color: STATUS_PIE_COLORS[idx % STATUS_PIE_COLORS.length],
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="py-0 border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`size-5 ${stat.iconColor}`} />
                  </div>
                  {stat.label === 'Total Revenue' && (
                    <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${revenueChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {revenueChange >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {Math.abs(revenueChange).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Row 2: Revenue Chart + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                <BarChart3 className="size-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Revenue (Last 7 Days)</h3>
                <p className="text-xs text-gray-400">Daily breakdown of orders & revenue</p>
              </div>
            </div>
            {dailyRevenue.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-700">₹{totalPeriodRevenue.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-green-600 mt-0.5">Total Revenue</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-emerald-700">₹{Math.round(avgDailyRevenue).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Avg Daily</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-teal-700">{totalPeriodOrders}</p>
                    <p className="text-[10px] text-teal-600 mt-0.5">Total Orders</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(val: number) => (val >= 1000 ? `₹${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : `₹${val}`)} />
                      <Tooltip content={<RevenueChartTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={32} fill="url(#revenueGrad)" opacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <BarChart3 className="size-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center">
                <TrendingUp className="size-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Orders by Status</h3>
                <p className="text-xs text-gray-400">Current order distribution</p>
              </div>
            </div>
            {statusPieData.length > 0 ? (
              <div>
                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Orders']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {stats?.ordersByStatus.map((item) => {
                    const total = stats.ordersByStatus.reduce((sum, s) => sum + s.count, 0);
                    const pct = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div key={item.status} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_PIE_COLORS[Object.keys(ORDER_STATUS_LABELS).indexOf(item.status)] || '#9ca3af' }} />
                        <span className="text-xs text-gray-600 flex-1 truncate">{ORDER_STATUS_LABELS[item.status] || item.status}</span>
                        <span className="text-xs font-bold text-gray-800">{item.count}</span>
                        <span className="text-[10px] text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <TrendingUp className="size-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No status data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center">
                <ShoppingCart className="size-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Recent Orders</h3>
                <p className="text-xs text-gray-400">Latest customer orders</p>
              </div>
            </div>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {stats.recentOrders.slice(0, 6).map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleOrderClick(order.id)}
                    className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-green-50 rounded-xl hover:shadow-sm transition-all text-left group border border-transparent hover:border-green-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">{(order as Record<string, unknown>).orderId || `#${order.id.slice(-8).toUpperCase()}`}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatFullDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-bold text-gray-800">₹{(order.total ?? 0).toFixed(2)}</p>
                      <Badge className={`${ORDER_STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'} text-[10px] border-0 mt-1`}>
                        {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <ShoppingCart className="size-10 mb-2 opacity-30" />
                <p className="text-sm">No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-50 flex items-center justify-center">
                  <Trophy className="size-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Top Products</h3>
                  <p className="text-xs text-gray-400">Best sellers by revenue</p>
                </div>
              </div>
              <button
                onClick={() => setAddDialogOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3.5 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="size-3.5" />
                Add
              </button>
            </div>
            {topProducts.length > 0 ? (
              <div className="max-h-96 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {topProducts.map((product, index) => (
                    <div
                      key={`${product.name}-${index}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-amber-50/50 rounded-xl transition-all group"
                    >
                      {/* Rank */}
                      <span className={`flex items-center justify-center size-8 rounded-full text-xs font-bold shrink-0 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' :
                        index === 1 ? 'bg-gray-100 text-gray-600 ring-2 ring-gray-200' :
                        index === 2 ? 'bg-amber-50 text-amber-600 ring-2 ring-amber-100' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {index === 0 ? <Star className="size-3.5" /> : index + 1}
                      </span>

                      {/* Image */}
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="size-10 rounded-lg object-cover shrink-0 bg-gray-100 border" />
                      ) : (
                        <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border">
                          <Package className="size-4 text-gray-400" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                        <p className="text-[11px] text-gray-400">{product.qty} sold</p>
                      </div>

                      {/* Revenue */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-800">₹{product.revenue.toLocaleString('en-IN')}</p>
                      </div>

                      {/* Action buttons — always visible on mobile, hover on desktop */}
                      <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-green-600 transition-all shadow-sm"
                          title={`Edit ${product.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-600 transition-all shadow-sm"
                          title={`Delete ${product.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Trophy className="size-10 mb-2 opacity-30" />
                <p className="text-sm">No product data yet</p>
                <button onClick={() => setAddDialogOpen(true)} className="mt-3 text-xs text-green-600 hover:text-green-700 font-medium">
                  Add your first top product
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddTopProductDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSaved={fetchStats}
      />
      <EditProductModal
        open={!!editProductId}
        onClose={() => setEditProductId(null)}
        productId={editProductId}
        onSaved={fetchStats}
      />
      <DeleteProductDialog
        open={!!deleteProductId}
        onClose={() => { setDeleteProductId(null); setDeleteProductName(''); }}
        productName={deleteProductName}
        productId={deleteProductId}
        onDeleted={fetchStats}
      />
    </div>
  );
}
