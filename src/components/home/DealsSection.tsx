'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { CATEGORY_ICONS } from '@/types';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Plus, Flame } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function DealsSection() {
  const { navigate, selectProduct, addToCart } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?sortBy=price-asc&limit=8')
      .then((res) => res.json())
      .then((data) => {
        const all = data?.data || data || [];
        // Filter to show only products with discount
        setProducts(all.filter((p: Product) => p.mrp > p.price).slice(0, 8));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    toast({ title: 'Added to cart', description: `${product.name} added to your cart` });
  };

  const handleProductClick = (product: Product) => {
    selectProduct(product.id);
    navigate('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDiscount = (product: Product) => {
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  };

  const getCategoryEmoji = (catSlug?: string) => {
    return CATEGORY_ICONS[catSlug || ''] || '📦';
  };

  const getCategoryBg = (catSlug?: string) => {
    const map: Record<string, string> = {
      'fruits': 'bg-gradient-to-br from-red-50 to-rose-100',
      'vegetables': 'bg-gradient-to-br from-green-50 to-emerald-100',
      'dairy': 'bg-gradient-to-br from-blue-50 to-sky-100',
      'snacks': 'bg-gradient-to-br from-amber-50 to-yellow-100',
      'dry-fruits': 'bg-gradient-to-br from-orange-50 to-amber-100',
      'household': 'bg-gradient-to-br from-cyan-50 to-teal-100',
      'personal-care': 'bg-gradient-to-br from-purple-50 to-violet-100',
      'staples': 'bg-gradient-to-br from-lime-50 to-green-100',
    };
    return map[catSlug || ''] || 'bg-gradient-to-br from-gray-50 to-slate-100';
  };

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm shadow-amber-500/20">
            <Flame className="size-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Today&apos;s Best Deals</h2>
            <p className="text-sm text-gray-500 mt-0.5">Grab these amazing offers before they expire</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const discount = getDiscount(product);
          const hasImage = product.image && product.image.length > 0;

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleProductClick(product); }}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden text-left cursor-pointer"
            >
              <div className="relative h-32 sm:h-36">
                {hasImage ? (
                  <div className="product-img-wrapper w-full h-full">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${getCategoryBg(product.category?.slug)}`}>
                    <span className="text-4xl sm:text-5xl">
                      {getCategoryEmoji(product.category?.slug)}
                    </span>
                  </div>
                )}
                {/* Discount badge */}
                <span className="absolute top-2.5 left-2.5 discount-badge">{discount}% OFF</span>
                {/* Deal badge with pulse */}
                <span className="absolute top-2.5 right-2.5 deal-badge deal-badge-pulse">Deal</span>
                {/* Gradient discount indicator at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60" />
              </div>
              <div className="p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{product.brand}</p>
                <h3 className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2 leading-snug">
                  {product.name}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{product.unit}</p>
                <div className="star-rating mt-1">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-base font-bold text-gray-800">₹{product.price}</span>
                    <span className="text-xs text-gray-400 line-through ml-1">₹{product.mrp}</span>
                    <p className="text-[10px] text-green-600 font-semibold mt-0.5">You save ₹{product.mrp - product.price}</p>
                  </div>
                  {product.inStock ? (
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all duration-200 shadow-sm shadow-green-600/20"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
