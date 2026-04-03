'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { CATEGORY_ICONS } from '@/types';
import type { Product } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import StarRating from '@/components/ui/StarRating';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { selectProduct, navigate, addToCart, cartItems } = useStore();

  const handleProductClick = () => {
    selectProduct(product.id);
    navigate('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(product);
    toast({ title: 'Added to cart', description: `${product.name} added to your cart` });
  };

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const cartItem = cartItems.find((i) => i.productId === product.id);
  const inCartQty = cartItem?.quantity || 0;

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

  const hasImage = product.image && product.image.length > 0;

  return (
    <div
      onClick={handleProductClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleProductClick(); }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden text-left w-full cursor-pointer"
    >
      {/* Image area */}
      <div className="relative h-40 sm:h-44">
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

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="discount-badge">{discount}% OFF</span>
          )}
          {product.featured && (
            <span className="deal-badge">⭐ Featured</span>
          )}
        </div>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="text-sm font-bold text-red-500 bg-white/90 px-4 py-2 rounded-full shadow-sm border border-red-100">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{product.brand}</p>
        <h3 className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-[11px] text-gray-400 mt-0.5">{product.unit}</p>

        {/* Rating */}
        <div className="mt-1.5">
          <StarRating rating={product.rating} size="sm" showValue count={product.reviewCount} />
        </div>

        {/* Price & Add to cart */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
          <div>
            <span className="text-lg font-bold text-gray-800">₹{product.price}</span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through ml-1.5">₹{product.mrp}</span>
            )}
          </div>
          {product.inStock ? (
            inCartQty > 0 ? (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-full">
                In cart ({inCartQty})
              </span>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all duration-200 shadow-sm shadow-green-600/20"
              >
                <Plus className="size-4" />
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
