/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Product, Category, PaginatedResponse } from '@/types';
import { CATEGORY_ICONS } from '@/types';
import {
  Search,
  Star,
  Eye,
  Pencil,
  Package,
  Trash2,
  Plus,
  Camera,
  X,
  Loader2,
  RefreshCw,
  ImagePlus,
  LayoutGrid,
  Video,
  Film,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isVideoDataUrl(url: string): boolean {
  return url.startsWith('data:video/');
}

// ─── Default Product Form State ───────────────────────────────────────────────

interface ProductFormData {
  name: string;
  slug: string;
  brand: string;
  description: string;
  categoryId: string;
  unit: string;
  price: string;
  mrp: string;
  stock: string;
  featured: boolean;
  inStock: boolean;
  image: string;
  images: string[];
}

const defaultProductForm = (): ProductFormData => ({
  name: '',
  slug: '',
  brand: '',
  description: '',
  categoryId: '',
  unit: '1 pc',
  price: '',
  mrp: '',
  stock: '0',
  featured: false,
  inStock: true,
  image: '',
  images: [],
});

// ─── Default Category Form State ──────────────────────────────────────────────

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: string;
  isActive: boolean;
}

const defaultCategoryForm = (): CategoryFormData => ({
  name: '',
  slug: '',
  description: '',
  image: '',
  sortOrder: '0',
  isActive: true,
});

// ─── Image Upload Area ────────────────────────────────────────────────────────

function ImageUploadArea({
  label,
  currentPreview,
  onFileSelect,
  onRemove,
  accept = 'image/*,video/*',
}: {
  label: string;
  currentPreview: string;
  onFileSelect: (dataUrl: string, file: File) => void;
  onRemove: () => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file);
        onFileSelect(dataUrl, file);
      } catch {
        toast({ title: 'Error', description: 'Failed to read file', variant: 'destructive' });
      }
    },
    [onFileSelect],
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {currentPreview ? (
        <div className="relative group w-full max-w-[200px]">
          <div className="rounded-lg border overflow-hidden bg-gray-50">
            {isVideoDataUrl(currentPreview) ? (
              <div className="relative">
                <video
                  src={currentPreview}
                  className="w-full h-32 object-cover"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                    <Film className="size-4 text-white" />
                  </div>
                </div>
                <Badge className="absolute top-1 left-1 text-[9px] border-0 bg-black/60 text-white">Video</Badge>
              </div>
            ) : (
              <img
                src={currentPreview}
                alt="Preview"
                className="w-full h-32 object-cover"
              />
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragOver
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-green-400 bg-gray-50 hover:bg-green-50/50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <Camera className="size-8 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500">Click to upload image/video</span>
          <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, GIF, MP4, etc.</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}

// ─── Multiple Images Upload Area ──────────────────────────────────────────────

function MultiImageUploadArea({
  previews,
  onFilesAdd,
  onRemoveImage,
}: {
  previews: string[];
  onFilesAdd: (dataUrls: string[]) => void;
  onRemoveImage: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      const urls: string[] = [];
      for (const file of fileArr) {
        try {
          const dataUrl = await fileToDataUrl(file);
          urls.push(dataUrl);
        } catch {
          // skip failed
        }
      }
      if (urls.length > 0) onFilesAdd(urls);
    },
    [onFilesAdd],
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Additional Images</Label>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((url, idx) => (
            <div key={idx} className="relative group w-16 h-16">
              <div className="rounded-md border overflow-hidden bg-gray-50">
                {isVideoDataUrl(url) ? (
                  <div className="relative w-full h-full">
                    <video src={url} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Film className="size-3 text-white drop-shadow" />
                    </div>
                    <Badge className="absolute top-0 left-0 text-[7px] border-0 bg-black/60 text-white px-1 py-0 rounded-b-none rounded-tr-none">Video</Badge>
                  </div>
                ) : (
                  <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label
        className={`flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragOver
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-green-400 bg-gray-50 hover:bg-green-50/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus className="size-5 text-gray-400" />
        <span className="text-xs text-gray-500">Click or drag to add images/videos</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

// ─── Product Form Dialog ──────────────────────────────────────────────────────

function ProductFormDialog({
  open,
  onClose,
  editingProduct,
  categories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  categories: Category[];
  onSaved: () => void;
}) {
  const isEdit = !!editingProduct;
  const [form, setForm] = useState<ProductFormData>(defaultProductForm);
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setForm({
          name: editingProduct.name || '',
          slug: editingProduct.slug || '',
          brand: editingProduct.brand || '',
          description: editingProduct.description || '',
          categoryId: editingProduct.categoryId || '',
          unit: editingProduct.unit || '1 pc',
          price: editingProduct.price?.toString() || '',
          mrp: editingProduct.mrp?.toString() || '',
          stock: editingProduct.stock?.toString() || '0',
          featured: !!editingProduct.featured,
          inStock: !!editingProduct.inStock,
          image: editingProduct.image || '',
          images: editingProduct.images ? editingProduct.images.split(',').filter(Boolean) : [],
        });
        setSlugEdited(true);
      } else {
        setForm(defaultProductForm());
        setSlugEdited(false);
      }
    }
  }, [open, editingProduct]);

  const updateField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugEdited) {
        next.slug = generateSlug(value as string);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation Error', description: 'Product name is required', variant: 'destructive' });
      return;
    }
    if (!form.categoryId) {
      toast({ title: 'Validation Error', description: 'Please select a category', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || generateSlug(form.name),
        brand: form.brand.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        unit: form.unit.trim() || '1 pc',
        price: parseFloat(form.price) || 0,
        mrp: parseFloat(form.mrp) || 0,
        stock: parseInt(form.stock, 10) || 0,
        featured: form.featured,
        inStock: form.inStock,
        image: form.image,
        images: form.images.join(','),
      };

      const url = isEdit ? `/api/products/${editingProduct!.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && (data.id || data.success)) {
        toast({ title: isEdit ? 'Product Updated' : 'Product Created', description: `"${form.name}" has been ${isEdit ? 'updated' : 'created'}.` });
        onClose();
        onSaved();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to save product', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update product details below.' : 'Fill in the details to create a new product.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Organic Almonds"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                updateField('slug', e.target.value);
              }}
              placeholder="auto-generated-from-name"
            />
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Brand</Label>
            <Input
              value={form.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="e.g. NutriBite"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Category *</Label>
            <Select value={form.categoryId} onValueChange={(v) => updateField('categoryId', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {CATEGORY_ICONS[cat.slug] || '📁'} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Unit</Label>
            <Input
              value={form.unit}
              onChange={(e) => updateField('unit', e.target.value)}
              placeholder="e.g. 1 pc, 500g"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Price (₹)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              placeholder="0"
            />
          </div>

          {/* MRP */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">MRP (₹)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.mrp}
              onChange={(e) => updateField('mrp', e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Stock */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Stock</Label>
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => updateField('stock', e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Featured */}
          <div className="flex items-center gap-3 pt-5">
            <Switch
              checked={form.featured}
              onCheckedChange={(v) => updateField('featured', v)}
            />
            <Label className="text-xs font-medium">Featured Product</Label>
          </div>

          {/* In Stock */}
          <div className="flex items-center gap-3 pt-5">
            <Switch
              checked={form.inStock}
              onCheckedChange={(v) => updateField('inStock', v)}
            />
            <Label className="text-xs font-medium">In Stock</Label>
          </div>

          {/* Description */}
          <div className="col-span-1 md:col-span-2 space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Product description..."
              rows={3}
            />
          </div>

          {/* Main Image */}
          <div className="col-span-1 md:col-span-2">
            <ImageUploadArea
              label="Main Image"
              currentPreview={form.image}
              onFileSelect={(dataUrl) => updateField('image', dataUrl)}
              onRemove={() => updateField('image', '')}
            />
          </div>

          {/* Additional Images */}
          <div className="col-span-1 md:col-span-2">
            <MultiImageUploadArea
              previews={form.images}
              onFilesAdd={(urls) => updateField('images', [...form.images, ...urls])}
              onRemoveImage={(idx) => updateField('images', form.images.filter((_, i) => i !== idx))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving && <Loader2 className="size-4 mr-1 animate-spin" />}
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Category Form Dialog ─────────────────────────────────────────────────────

function CategoryFormDialog({
  open,
  onClose,
  editingCategory,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editingCategory: Category | null;
  onSaved: () => void;
}) {
  const isEdit = !!editingCategory;
  const [form, setForm] = useState<CategoryFormData>(defaultCategoryForm);
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setForm({
          name: editingCategory.name || '',
          slug: editingCategory.slug || '',
          description: editingCategory.description || '',
          image: editingCategory.image || '',
          sortOrder: editingCategory.sortOrder?.toString() || '0',
          isActive: editingCategory.isActive !== false,
        });
        setSlugEdited(true);
      } else {
        setForm(defaultCategoryForm());
        setSlugEdited(false);
      }
    }
  }, [open, editingCategory]);

  const updateField = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugEdited) {
        next.slug = generateSlug(value as string);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || generateSlug(form.name),
        description: form.description.trim(),
        image: form.image,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        isActive: form.isActive,
      };

      const method = isEdit ? 'PUT' : 'POST';
      const url = '/api/categories';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editingCategory!.id, ...payload } : payload),
      });
      const data = await res.json();

      if (res.ok && (data.id || data.success)) {
        toast({ title: isEdit ? 'Category Updated' : 'Category Created', description: `"${form.name}" has been ${isEdit ? 'updated' : 'created'}.` });
        onClose();
        onSaved();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to save category', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update category details below.' : 'Fill in the details to create a new category.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Organic Foods"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                updateField('slug', e.target.value);
              }}
              placeholder="auto-generated-from-name"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Category description..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Sort Order</Label>
            <Input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => updateField('sortOrder', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.isActive} onCheckedChange={(v) => updateField('isActive', v)} />
            <Label className="text-xs font-medium">Active</Label>
          </div>

          <ImageUploadArea
            label="Category Image"
            currentPreview={form.image}
            onFileSelect={(dataUrl) => updateField('image', dataUrl)}
            onRemove={() => updateField('image', '')}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving && <Loader2 className="size-4 mr-1 animate-spin" />}
            {isEdit ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onClose,
  itemName,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  itemName: string;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <span className="font-semibold text-gray-800">&quot;{itemName}&quot;</span>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
          >
            {loading && <Loader2 className="size-4 mr-1 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminProductManager() {
  const { selectProduct, navigate } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [updatingFeatured, setUpdatingFeatured] = useState<string | null>(null);

  // Product dialog
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete product dialog
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingProductLoading, setDeletingProductLoading] = useState(false);

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete category dialog
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deletingCategoryLoading, setDeletingCategoryLoading] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '15');
    if (search) params.set('search', search);

    fetch(`/api/admin/products?${params}`)
      .then((res) => res.json())
      .then((data: PaginatedResponse<Product>) => {
        setProducts(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchCategories = useCallback(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleViewProduct = (product: Product) => {
    selectProduct(product.id);
    navigate('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStockUpdate = async (productId: string) => {
    const numStock = parseInt(stockValue, 10);
    if (isNaN(numStock) || numStock < 0) return;

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ productId, stock: numStock }] }),
      });
      const data = await res.json();
      if (data.updatedProducts || data.message) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: numStock, inStock: numStock > 0 } : p)),
        );
        toast({ title: 'Stock updated' });
      } else {
        toast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
    }
    setEditingStock(null);
  };

  const handleToggleFeatured = async (product: Product) => {
    setUpdatingFeatured(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      });
      const data = await res.json();
      if (data.id) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, featured: !p.featured } : p)),
        );
        toast({ title: product.featured ? 'Removed from featured' : 'Added to featured' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
    setUpdatingFeatured(null);
  };

  // Delete product handler
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeletingProductLoading(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && (data.success || data.id)) {
        setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
        toast({ title: 'Product Deleted', description: `"${deletingProduct.name}" has been deleted.` });
        setDeleteProductDialogOpen(false);
        setDeletingProduct(null);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
    setDeletingProductLoading(false);
  };

  // Delete category handler
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeletingCategoryLoading(true);
    try {
      const res = await fetch(`/api/categories?id=${deletingCategory.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && (data.success || data.id)) {
        setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
        toast({ title: 'Category Deleted', description: `"${deletingCategory.name}" has been deleted.` });
        setDeleteCategoryDialogOpen(false);
        setDeletingCategory(null);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete category', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
    setDeletingCategoryLoading(false);
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || catId;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="products" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <TabsList>
            <TabsTrigger value="products" className="gap-1.5">
              <Package className="size-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5">
              <LayoutGrid className="size-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          {loading ? null : (
            <div className="flex items-center gap-2">
              <Button onClick={fetchProducts} variant="outline" size="sm">
                <RefreshCw className="size-3.5 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setEditingProduct(null);
                  setProductDialogOpen(true);
                }}
              >
                <Plus className="size-4 mr-1" />
                Add Product
              </Button>
            </div>
          )}
        </div>

        {/* ── Products Tab ────────────────────────────────────────────────── */}
        <TabsContent value="products">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products..."
                className="pl-10 h-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Price</TableHead>
                      <TableHead className="text-xs">Stock</TableHead>
                      <TableHead className="text-xs">Rating</TableHead>
                      <TableHead className="text-xs">Featured</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.image ? (
                              <div className="w-9 h-9 rounded-md border overflow-hidden bg-gray-50 flex-shrink-0">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <span className="text-lg flex-shrink-0">
                                {CATEGORY_ICONS[product.category?.slug] || '📦'}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {product.brand} · {product.unit}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {getCategoryName(product.categoryId)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm font-medium text-gray-800">₹{product.price}</span>
                            {product.mrp > product.price && (
                              <p className="text-[10px] text-gray-400 line-through">₹{product.mrp}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingStock === product.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={stockValue}
                                onChange={(e) => setStockValue(e.target.value)}
                                className="w-16 h-7 text-xs"
                                min={0}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleStockUpdate(product.id)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-green-600"
                                onClick={() => handleStockUpdate(product.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => setEditingStock(null)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${
                                  product.inStock
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                } text-[10px] border-0`}
                              >
                                {product.stock}
                              </Badge>
                              <button
                                onClick={() => {
                                  setEditingStock(product.id);
                                  setStockValue(product.stock.toString());
                                }}
                                className="text-xs text-gray-400 hover:text-green-600"
                              >
                                <Pencil className="size-3" />
                              </button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs">{product.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleFeatured(product)}
                            disabled={updatingFeatured === product.id}
                            className="text-xs"
                          >
                            <Badge
                              className={`${
                                product.featured
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-400'
                              } border-0 cursor-pointer text-[10px]`}
                            >
                              {product.featured ? '⭐ Featured' : 'Not featured'}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleViewProduct(product)}
                              title="View"
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setEditingProduct(product);
                                setProductDialogOpen(true);
                              }}
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeletingProduct(product);
                                setDeleteProductDialogOpen(true);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-gray-500 px-2">
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
            </div>
          )}
        </TabsContent>

        {/* ── Categories Tab ──────────────────────────────────────────────── */}
        <TabsContent value="categories">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{categories.length} categories total</p>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setEditingCategory(null);
                setCategoryDialogOpen(true);
              }}
            >
              <Plus className="size-4 mr-1" />
              Add Category
            </Button>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Slug</TableHead>
                    <TableHead className="text-xs">Products</TableHead>
                    <TableHead className="text-xs">Sort Order</TableHead>
                    <TableHead className="text-xs">Active</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-400 py-8">
                        No categories found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {cat.image ? (
                              <div className="w-8 h-8 rounded-md border overflow-hidden bg-gray-50 flex-shrink-0">
                                <img
                                  src={cat.image}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <span className="text-base flex-shrink-0">
                                {CATEGORY_ICONS[cat.slug] || '📁'}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                                {cat.name}
                              </p>
                              {cat.description && (
                                <p className="text-[10px] text-gray-400 truncate max-w-[180px]">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500 font-mono">{cat.slug}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gray-100 text-gray-600 text-[10px] border-0">
                            {cat.productCount ?? 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">{cat.sortOrder}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] border-0 ${
                              cat.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setEditingCategory(cat);
                                setCategoryDialogOpen(true);
                              }}
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeletingCategory(cat);
                                setDeleteCategoryDialogOpen(true);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Product Form Dialog ────────────────────────────────────────────── */}
      <ProductFormDialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        editingProduct={editingProduct}
        categories={categories}
        onSaved={() => {
          fetchProducts();
        }}
      />

      {/* ── Category Form Dialog ───────────────────────────────────────────── */}
      <CategoryFormDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        editingCategory={editingCategory}
        onSaved={() => {
          fetchCategories();
        }}
      />

      {/* ── Delete Product Confirmation ────────────────────────────────────── */}
      <DeleteConfirmDialog
        open={deleteProductDialogOpen}
        onClose={() => {
          setDeleteProductDialogOpen(false);
          setDeletingProduct(null);
        }}
        itemName={deletingProduct?.name || ''}
        onConfirm={handleDeleteProduct}
        loading={deletingProductLoading}
      />

      {/* ── Delete Category Confirmation ───────────────────────────────────── */}
      <DeleteConfirmDialog
        open={deleteCategoryDialogOpen}
        onClose={() => {
          setDeleteCategoryDialogOpen(false);
          setDeletingCategory(null);
        }}
        itemName={deletingCategory?.name || ''}
        onConfirm={handleDeleteCategory}
        loading={deletingCategoryLoading}
      />
    </div>
  );
}
