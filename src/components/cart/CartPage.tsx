'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { Coupon } from '@/types';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShoppingBag,
  Tag,
  ArrowLeft,
  Truck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateCartQuantity,
    getCartTotal,
    getCartMrpTotal,
    getCartCount,
    couponDiscount,
    appliedCoupon,
    setAppliedCoupon,
    setCouponDiscount,
    clearCoupon,
    navigate,
    goBack,
  } = useStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const total = getCartTotal();
  const mrpTotal = getCartMrpTotal();
  const itemCount = getCartCount();
  const savings = mrpTotal - total - couponDiscount;
  const deliveryFee = total >= 500 ? 0 : 40;
  const grandTotal = total - couponDiscount + deliveryFee;
  const deliveryProgress = Math.min(100, (total / 500) * 100);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ title: 'Error', description: 'Please enter a coupon code', variant: 'destructive' });
      return;
    }
    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderTotal: total }),
      });
      const data = await res.json();
      if (data.discount !== undefined && data.coupon) {
        setAppliedCoupon(data.coupon);
        setCouponDiscount(data.discount);
        toast({ title: 'Coupon applied!', description: `You saved ₹${data.discount}` });
      } else {
        toast({ title: 'Invalid coupon', description: data.error || 'This coupon is not valid', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to apply coupon', variant: 'destructive' });
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    clearCoupon();
    setCouponCode('');
    toast({ title: 'Coupon removed' });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-5 shadow-sm border border-gray-200">
          <ShoppingBag className="size-14 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">Add items to your cart to get started</p>
        <Button
          onClick={() => navigate('products')}
          className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 shadow-lg shadow-green-600/20 rounded-xl h-11 px-6 font-semibold"
        >
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            My Cart <span className="text-gray-400 font-normal text-lg">({itemCount} items)</span>
          </h1>
        </div>
        {total < 500 && (
          <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Truck className="size-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-800">
              Add &#8377;{(500 - total).toFixed(2)} more for FREE delivery
            </span>
          </div>
        )}
      </div>

      {/* Delivery progress bar - mobile */}
      {total < 500 && (
        <div className="sm:hidden bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <Truck className="size-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Add &#8377;{(500 - total).toFixed(2)} more for FREE delivery
            </span>
          </div>
          <div className="w-full bg-amber-200/60 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${deliveryProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-amber-600 mt-1.5">&#8377;{total.toFixed(0)} of &#8377;500</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item.productId} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow group">
              {/* Product image */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                {item.product?.image ? (
                  <img
                    src={item.product.image}
                    alt={item.product.name || 'Product'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <ShoppingBag className="size-7 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">{item.product?.brand}</p>
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mt-0.5">{item.product?.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product?.unit}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-gray-800">&#8377;{item.product?.price}</span>
                    {item.product && item.product.mrp > item.product.price && (
                      <span className="text-xs text-gray-400 line-through">&#8377;{item.product.mrp}</span>
                    )}
                    {item.product && item.product.mrp > item.product.price && (
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        {Math.round(((item.product.mrp - item.product.price) / item.product.mrp) * 100)}% off
                      </span>
                    )}
                  </div>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                    <button
                      onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-500"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-gray-700 border-x border-gray-100">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-green-50 active:bg-green-100 transition-colors text-green-600"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4">Order Summary</h3>

            {/* Coupon */}
            <div className="mb-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">{appliedCoupon.code}</p>
                      <p className="text-xs text-emerald-600">&#8377;{couponDiscount} off</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-600 font-semibold hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 h-10 text-sm pl-9 border-gray-200 focus-visible:ring-emerald-200 focus-visible:border-emerald-300"
                    />
                  </div>
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 font-semibold"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </Button>
                </div>
              )}
            </div>

            <Separator className="mb-4" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (MRP)</span>
                <span className="font-medium">&#8377;{mrpTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Product Discount</span>
                <span className="font-medium">-&#8377;{(mrpTotal - total).toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span className="font-medium">-&#8377;{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'text-emerald-600 font-semibold' : 'font-medium'}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center mb-5">
              <span className="text-base font-bold text-gray-800">Total Amount</span>
              <span className="text-xl font-bold text-gray-800">&#8377;{grandTotal.toFixed(2)}</span>
            </div>

            {savings > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl px-4 py-3 mb-4 text-center border border-emerald-100">
                <span className="text-sm text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  You save &#8377;{savings.toFixed(2)} on this order
                </span>
              </div>
            )}

            <Button
              onClick={handleCheckout}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl text-base font-semibold shadow-lg shadow-green-600/20 transition-all"
            >
              Proceed to Checkout <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
