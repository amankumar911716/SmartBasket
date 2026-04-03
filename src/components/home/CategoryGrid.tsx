'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { CATEGORY_ICONS } from '@/types';
import type { Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Grid3X3 } from 'lucide-react';

const CATEGORY_EMOJI_FALLBACK: string[] = [
  '🍎', '🥬', '🥛', '🍿', '🥜', '🧹', '🧴', '🌾', '🍞', '🥚', '🫒', '🧅',
];

export default function CategoryGrid() {
  const { navigate, selectCategory } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCategoryClick = (cat: Category) => {
    selectCategory(cat.id);
    navigate('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section id="categories-section" className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="categories-section" className="max-w-7xl mx-auto px-4 py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-green-600/20">
            <Grid3X3 className="size-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Shop by Category</h2>
            <p className="text-sm text-gray-500 mt-0.5">Browse from our wide range of categories</p>
          </div>
        </div>
        <button
          onClick={() => { selectCategory(null); navigate('products'); }}
          className="text-sm text-green-600 font-medium flex items-center gap-1 hover:text-green-700 transition-colors group"
        >
          View All <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {categories.map((cat, idx) => {
          const emoji = CATEGORY_ICONS[cat.slug] || CATEGORY_EMOJI_FALLBACK[idx % CATEGORY_EMOJI_FALLBACK.length];
          const hasImage = cat.image && cat.image.length > 0;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="group relative bg-white overflow-hidden rounded-2xl border border-gray-100 shadow-sm card-hover p-4 sm:p-5 text-center"
            >
              {hasImage ? (
                <div className="product-img-wrapper w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-xl overflow-hidden shadow-sm">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl">
                  <span className="text-3xl sm:text-4xl">
                    {emoji}
                  </span>
                </div>
              )}
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                {cat.name}
              </h3>
              {cat.productCount !== undefined && (
                <p className="text-xs text-gray-400 mt-1">
                  {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
