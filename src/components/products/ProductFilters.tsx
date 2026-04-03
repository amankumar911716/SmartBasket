'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { CATEGORY_ICONS } from '@/types';

interface ProductFiltersProps {
  onFilterChange: (filters: {
    categoryId?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sortBy?: string;
  }) => void;
  activeFilters: {
    categoryId?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sortBy?: string;
  };
  onReset: () => void;
}

export default function ProductFilters({ onFilterChange, activeFilters, onReset }: ProductFiltersProps) {
  const { selectCategory, navigate } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/products?limit=100')
      .then((res) => res.json())
      .then((data) => {
        const prods = data?.data || data || [];
        const uniqueBrands = [...new Set(prods.map((p: { brand: string }) => p.brand).filter(Boolean))] as string[];
        setBrands(uniqueBrands.sort());
        if (prods.length > 0) {
          const prices = prods.map((p: { price: number }) => p.price);
          setPriceRange([0, Math.ceil(Math.max(...prices) / 100) * 100]);
        }
      })
      .catch(() => {});
  }, []);

  const hasActiveFilters = activeFilters.categoryId || activeFilters.brand || activeFilters.rating ||
    activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined;

  const handleCategoryClick = (catId?: string) => {
    onFilterChange({ ...activeFilters, categoryId: catId || undefined });
    if (catId) {
      selectCategory(catId);
    }
  };

  const handleBrandClick = (brand: string) => {
    onFilterChange({
      ...activeFilters,
      brand: activeFilters.brand === brand ? undefined : brand,
    });
  };

  const handleRatingClick = (rating: number) => {
    onFilterChange({
      ...activeFilters,
      rating: activeFilters.rating === rating ? undefined : rating,
    });
  };

  const handleSortChange = (sortBy: string) => {
    onFilterChange({ ...activeFilters, sortBy });
  };

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange = type === 'min' ? [value, priceRange[1]] : [priceRange[0], value];
    setPriceRange(newRange as [number, number]);
    onFilterChange({
      ...activeFilters,
      minPrice: newRange[0] > 0 ? newRange[0] : undefined,
      maxPrice: newRange[1] < priceRange[1] ? newRange[1] : undefined,
    });
  };

  const renderFilterContent = () => (
    <div className="space-y-5">
      {/* Clear all */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Active Filters</span>
          <button
            onClick={onReset}
            className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
          >
            <X className="size-3" /> Clear All
          </button>
        </div>
      )}

      <Separator />

      {/* Categories */}
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full"
        >
          <h4 className="text-sm font-semibold text-gray-700">Categories</h4>
          <ChevronDown className={`size-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
            <button
              onClick={() => handleCategoryClick(undefined)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                !activeFilters.categoryId ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeFilters.categoryId === cat.id ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{CATEGORY_ICONS[cat.slug] || '📦'}</span>
                {cat.name}
                {cat.productCount !== undefined && (
                  <span className="ml-auto text-xs text-gray-400">({cat.productCount})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400">Min</label>
            <input
              type="number"
              value={activeFilters.minPrice ?? 0}
              onChange={(e) => handlePriceChange('min', Number(e.target.value))}
              className="w-full h-8 text-sm border rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="₹0"
            />
          </div>
          <span className="text-gray-400 mt-4">-</span>
          <div className="flex-1">
            <label className="text-[10px] text-gray-400">Max</label>
            <input
              type="number"
              value={activeFilters.maxPrice ?? priceRange[1]}
              onChange={(e) => handlePriceChange('max', Number(e.target.value))}
              className="w-full h-8 text-sm border rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="₹2000"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Brand */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Brand</h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => handleBrandClick(brand)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                activeFilters.brand === brand ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingClick(rating)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                activeFilters.rating === rating ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span>&amp; up</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sort By */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Sort By</h4>
        <div className="space-y-1.5">
          {[
            { value: '', label: 'Relevance' },
            { value: 'price-asc', label: 'Price: Low to High' },
            { value: 'price-desc', label: 'Price: High to Low' },
            { value: 'rating', label: 'Top Rated' },
            { value: 'newest', label: 'Newest First' },
            { value: 'name', label: 'Name: A-Z' },
          ].map((sort) => (
            <button
              key={sort.value}
              onClick={() => handleSortChange(sort.value)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                activeFilters.sortBy === sort.value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter toggle button */}
      <div className="lg:hidden flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-green-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              !
            </span>
          )}
        </Button>
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {activeFilters.brand && (
            <span className="shrink-0 bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
              {activeFilters.brand}
              <X className="size-3 cursor-pointer" onClick={() => onFilterChange({ ...activeFilters, brand: undefined })} />
            </span>
          )}
          {activeFilters.rating && (
            <span className="shrink-0 bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
              {activeFilters.rating}★ &amp; up
              <X className="size-3 cursor-pointer" onClick={() => onFilterChange({ ...activeFilters, rating: undefined })} />
            </span>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 bg-white rounded-xl border p-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            Filters
          </h3>
          {renderFilterContent()}
        </div>
      </aside>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                Filters
              </h3>
              <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-4">
              {renderFilterContent()}
            </div>
            <div className="sticky bottom-0 bg-white border-t p-4">
              <Button
                onClick={() => setMobileOpen(false)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Show Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
