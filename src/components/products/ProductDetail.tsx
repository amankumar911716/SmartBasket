'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { CATEGORY_ICONS } from '@/types';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  RotateCcw,
  Shield,
  ArrowLeft,
  Send,
  Loader2,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ProductCard from './ProductCard';
import StarRating from '@/components/ui/StarRating';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string;
}

export default function ProductDetail() {
  const { selectedProductId, goBack, addToCart, cartItems, user, isAuthenticated } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const fetchProduct = () => {
    if (!selectedProductId) return;
    setLoading(true);
    fetch(`/api/products/${selectedProductId}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        // Fetch related products
        if (data?.categoryId) {
          fetch(`/api/products?categoryId=${data.categoryId}&limit=8`)
            .then((r) => r.json())
            .then((rd) => {
              const prods = (rd?.data || rd || []).filter((p: Product) => p.id !== selectedProductId);
              setRelatedProducts(prods.slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  };

  const fetchReviews = useCallback(() => {
    if (!selectedProductId) return;
    setReviewsLoading(true);
    fetch(`/api/products/${selectedProductId}/reviews?limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setReviews(data.reviews || []);
          // Check if current user already rated
          if (user?.id && data.reviews) {
            const userReview = data.reviews.find((r: Review) => r.userName && r.rating);
            // We can't check by userId from the reviews response directly, but we check on submit
          }
        }
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [selectedProductId, user?.id]);

  useEffect(() => {
    fetchProduct();
  }, [selectedProductId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Sync quantity with cart
  useEffect(() => {
    if (product) {
      const cartItem = cartItems.find((i) => i.productId === product.id);
      setQuantity(cartItem?.quantity || 1);
    }
  }, [product, cartItems]);

  const handleSubmitRating = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Login Required', description: 'Please login to rate this product.', variant: 'destructive' });
      return;
    }
    if (userRating === 0) {
      toast({ title: 'Select Rating', description: 'Please select a star rating.', variant: 'destructive' });
      return;
    }

    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/products/${selectedProductId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          rating: userRating,
          comment: ratingComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHasRated(true);
        setUserRating(0);
        setRatingComment('');
        toast({ title: 'Rating Submitted!', description: `Thanks for rating ${product?.name}! ⭐` });
        // Refresh product to get updated rating
        fetchProduct();
        fetchReviews();
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to submit rating.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-80 md:h-96 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-40" />
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Product not found</p>
        <Button variant="outline" onClick={goBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const getCategoryEmoji = (catSlug?: string) => CATEGORY_ICONS[catSlug || ''] || '📦';

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

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addToCart(product, quantity);
    toast({ title: 'Added to cart', description: `${quantity}x ${product.name} added to cart` });
  };

  const cartItem = cartItems.find((i) => i.productId === product.id);
  const inCartQty = cartItem?.quantity || 0;

  const hasImage = product.image && product.image.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in-up">
      {/* Breadcrumb */}
      <button
        onClick={goBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to products</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="relative h-72 sm:h-80 md:h-[420px] rounded-2xl overflow-hidden">
          {hasImage ? (
            <>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
            </>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${getCategoryBg(product.category?.slug)}`}>
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <span className="text-[120px] sm:text-[140px]">
                {getCategoryEmoji(product.category?.slug)}
              </span>
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-4 left-4 discount-badge text-sm px-3 py-1">
              {discount}% OFF
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[3px] rounded-2xl flex items-center justify-center">
              <span className="text-lg font-bold text-red-500 bg-white/90 px-5 py-2.5 rounded-full shadow-md border border-red-100">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{product.brand}</span>
            <span className="text-gray-200">|</span>
            <span className="text-xs text-gray-400">{product.category?.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
            {product.name}
          </h1>

          {/* Rating Display */}
          <div className="flex items-center gap-2.5 mb-5">
            <StarRating rating={product.rating} size="md" showValue />
            <span className="text-sm text-gray-500">
              {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-gray-800">₹{product.price}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.mrp}</span>
                <Badge className="bg-green-50 text-green-700 text-xs border border-green-200 rounded-lg">
                  Save ₹{product.mrp - product.price}
                </Badge>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-5">{product.unit}</p>

          {/* Quantity selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <Minus className="size-4 text-gray-600" />
              </button>
              <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold text-gray-800 border-x border-gray-200">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <Plus className="size-4 text-gray-600" />
              </button>
            </div>
            {product.stock <= 10 && product.stock > 0 && (
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md">
                Only {product.stock} left
              </span>
            )}
          </div>

          {/* Add to Cart */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-base font-semibold disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 shadow-sm shadow-green-600/20 transition-all duration-200 active:scale-[0.98]"
            >
              <ShoppingCart className="size-5 mr-2" />
              {inCartQty > 0 ? `Update Cart (${inCartQty + (quantity > inCartQty ? quantity - inCartQty : 0)})` : 'Add to Cart'}
            </Button>
          </div>

          <Separator className="mb-5" />

          {/* Delivery Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="flex items-center gap-2.5 text-sm bg-gray-50/80 rounded-xl p-3 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <Truck className="size-4 text-green-600" />
              </div>
              <span className="text-gray-600 leading-snug">Free delivery above ₹500</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm bg-gray-50/80 rounded-xl p-3 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <RotateCcw className="size-4 text-blue-600" />
              </div>
              <span className="text-gray-600 leading-snug">7-day easy returns</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm bg-gray-50/80 rounded-xl p-3 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Shield className="size-4 text-purple-600" />
              </div>
              <span className="text-gray-600 leading-snug">Quality assured</span>
            </div>
          </div>

          <Separator className="mb-5" />

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {product.description || `Fresh and premium quality ${product.name?.toLowerCase()} from ${product.brand}. ${product.unit} packaging. Store in a cool, dry place for best freshness.`}
            </p>
          </div>
        </div>
      </div>

      {/* ===== RATE THIS PRODUCT SECTION ===== */}
      <div className="mt-10 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 rounded-2xl border border-amber-100/60 p-5 sm:p-7">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <ThumbsUp className="size-4.5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">Rate this Product</h3>
            <p className="text-xs text-gray-400">Share your experience with other buyers</p>
          </div>
        </div>

        {hasRated ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl border border-green-200">
              <ThumbsUp className="size-4" />
              <span className="text-sm font-medium">Thank you for your rating!</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Your feedback helps other customers make better choices.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
              <span className="text-sm text-gray-600 font-medium shrink-0">Your Rating:</span>
              <StarRating
                rating={userRating}
                interactive
                onRate={setUserRating}
                size="xl"
              />
              {userRating > 0 && (
                <span className="text-sm font-semibold text-amber-600">
                  {userRating === 1 ? 'Poor' : userRating === 2 ? 'Fair' : userRating === 3 ? 'Good' : userRating === 4 ? 'Very Good' : 'Excellent!'}
                </span>
              )}
            </div>

            <div>
              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Write a review (optional)... How was the quality, taste, freshness?"
                className="min-h-[80px] resize-none bg-white border-gray-200 focus:border-amber-300 focus:ring-amber-200/50 rounded-xl text-sm placeholder:text-gray-400"
                maxLength={500}
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-gray-400">
                  {!isAuthenticated ? 'Login to submit a review' : 'Your review helps others'}
                </span>
                <span className="text-xs text-gray-400">{ratingComment.length}/500</span>
              </div>
            </div>

            <Button
              onClick={handleSubmitRating}
              disabled={submittingRating || userRating === 0}
              className="h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-amber-500/20 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
            >
              {submittingRating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ===== REVIEWS LIST ===== */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-gray-500" />
            <h3 className="text-base font-bold text-gray-800">
              Customer Reviews ({product.reviewCount})
            </h3>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
            <span className="text-sm font-bold text-amber-700">{product.rating}</span>
            <span className="text-xs text-amber-500">/ 5</span>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                      {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {review.userName || 'Anonymous'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="mb-1.5">
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-gray-100">
            <MessageSquare className="size-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No reviews yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to review this product!</p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-bold text-gray-800 mb-6">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
