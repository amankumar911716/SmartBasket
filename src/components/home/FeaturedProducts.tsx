'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { CATEGORY_ICONS } from '@/types';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Plus, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function FeaturedProducts() {
  const { navigate, selectProduct, addToCart } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?featured=true&limit=12')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data?.data || data || []);
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
    if (product.mrp > product.price) {
      return Math.round(((product.mrp - product.price) / product.mrp) * 100);
    }
    return 0;
  };

  const getCategoryEmoji = (catSlug?: string) => {
    if (catSlug) return CATEGORY_ICONS[catSlug] || '📦';
    return '📦';
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
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-[200px] max-w-[200px]">
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-green-600/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Featured Products</h2>
            <p className="text-sm text-gray-500 mt-0.5">Handpicked fresh items just for you</p>
          </div>
        </div>
        <button
          onClick={() => navigate('products')}
          className="text-sm text-green-600 font-medium flex items-center gap-1 hover:text-green-700 transition-colors group"
        >
          View All <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
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
              className="group min-w-[180px] max-w-[180px] sm:min-w-[210px] sm:max-w-[210px] bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden text-left flex-shrink-0 cursor-pointer"
            >
              <div className="relative h-36 sm:h-40">
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
                    <span className="text-5xl sm:text-6xl">
                      {getCategoryEmoji(product.category?.slug)}
                    </span>
                  </div>
                )}
                {discount > 0 && (
                  <span className="absolute top-2.5 left-2.5 discount-badge">{discount}% OFF</span>
                )}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-red-500 bg-white/90 px-3 py-1.5 rounded-full shadow-sm border border-red-100">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{product.brand}</p>
                <h3 className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2 leading-snug">
                  {product.name}
                </h3>
                <div className="star-rating mt-1">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
                  <span className="text-[11px] text-gray-400">({product.reviewCount})</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-base font-bold text-gray-800">₹{product.price}</span>
                    {discount > 0 && (
                      <span className="text-xs text-gray-400 line-through ml-1">₹{product.mrp}</span>
                    )}
                  </div>
                  {product.inStock && (
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all duration-200 shadow-sm shadow-green-600/20"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
