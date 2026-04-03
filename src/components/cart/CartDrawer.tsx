'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export default function CartDrawer() {
  const {
    cartDrawerOpen,
    setCartDrawerOpen,
    cartItems,
    removeFromCart,
    updateCartQuantity,
    getCartTotal,
    getCartMrpTotal,
    getCartCount,
    couponDiscount,
    navigate,
  } = useStore();

  const total = getCartTotal();
  const mrpTotal = getCartMrpTotal();
  const itemCount = getCartCount();
  const savings = mrpTotal - total - couponDiscount;
  const deliveryFee = total >= 500 ? 0 : 40;
  const grandTotal = total - couponDiscount + deliveryFee;

  const handleViewCart = () => {
    setCartDrawerOpen(false);
    navigate('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = () => {
    setCartDrawerOpen(false);
    navigate('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0 bg-gradient-to-r from-gray-50 to-white">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            My Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-5 shadow-sm">
              <ShoppingBag className="size-11 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1.5">Your cart is empty</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Looks like you haven&apos;t added anything yet.
              <br />
              Start exploring fresh groceries!
            </p>
            <Button
              onClick={() => { setCartDrawerOpen(false); navigate('products'); }}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 shadow-lg shadow-green-600/20 rounded-xl h-11 px-6 font-semibold"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex gap-3 p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
                  {/* Product image thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                    {item.product?.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <ShoppingBag className="size-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1 leading-tight">{item.product?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product?.unit}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-gray-800">&#8377;{((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                        {item.product && item.product.mrp > item.product.price && (
                          <span className="text-[10px] text-gray-400 line-through">&#8377;{(item.product.mrp * item.quantity).toFixed(0)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 rounded-l-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-500"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-gray-700">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 rounded-r-lg flex items-center justify-center hover:bg-green-50 active:bg-green-100 transition-colors text-green-600"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="self-start p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary & Actions */}
            <div className="border-t bg-gradient-to-t from-gray-50 to-white px-5 py-4 shrink-0 space-y-3">
              {savings > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 px-3.5 py-2.5 rounded-xl border border-emerald-100">
                  <span className="font-medium flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    Total Savings
                  </span>
                  <span className="font-bold">&#8377;{savings.toFixed(2)}</span>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (MRP)</span>
                  <span className="font-medium">&#8377;{mrpTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-medium">-&#8377;{(mrpTotal - total + couponDiscount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">{deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `&#8377;${deliveryFee}`}</span>
                </div>
                {total < 500 && deliveryFee > 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                    Add &#8377;{(500 - total).toFixed(2)} more for free delivery
                  </p>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span>&#8377;{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl text-base font-semibold shadow-lg shadow-green-600/20 transition-all"
                >
                  Checkout <ArrowRight className="size-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleViewCart}
                  className="w-full h-10 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                >
                  View Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
