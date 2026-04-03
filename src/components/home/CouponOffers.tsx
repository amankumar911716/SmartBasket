'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { Tag, ChevronLeft, ChevronRight, Copy, Check, ArrowRight } from 'lucide-react';

interface CouponData {
  id: string;
  title: string;
  description: string;
  code: string;
  icon: string;
  gradient: string;
  badge: string;
  badgeColor: string;
  minOrder?: string;
  validTill?: string;
}

const coupons: CouponData[] = [
  {
    id: '1',
    title: 'Welcome Offer',
    description: 'Get 20% off on your first order',
    code: 'WELCOME20',
    icon: '🎉',
    gradient: 'linear-gradient(135deg, #10b981, #16a34a, #15803d)',
    badge: 'NEW USER',
    badgeColor: 'bg-yellow-400 text-yellow-900',
    minOrder: 'Min order ₹299',
    validTill: 'Valid till 15 Mar 2027',
  },
  {
    id: '2',
    title: 'Flat ₹100 Off',
    description: 'On all orders above ₹500',
    code: 'FLAT100',
    icon: '💰',
    gradient: 'linear-gradient(135deg, #fb923c, #f59e0b, #ea580c)',
    badge: 'HOT DEAL',
    badgeColor: 'bg-red-500 text-white',
    minOrder: 'Min order ₹500',
    validTill: 'Valid till 28 Apr 2027',
  },
  {
    id: '3',
    title: 'Go Green, Save More',
    description: '₹50 off on organic products',
    code: 'GREEN50',
    icon: '🌿',
    gradient: 'linear-gradient(135deg, #14b8a6, #059669, #0f766e)',
    badge: 'ORGANIC',
    badgeColor: 'bg-emerald-300 text-emerald-900',
    minOrder: 'No minimum order',
    validTill: 'Valid till 10 Jun 2027',
  },
  {
    id: '4',
    title: 'Weekend Bonanza',
    description: '₹150 off on orders ₹800+',
    code: 'WEEKEND150',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #f43f5e, #ec4899, #dc2626)',
    badge: 'WEEKEND',
    badgeColor: 'bg-white/90 text-rose-600',
    minOrder: 'Min order ₹800',
    validTill: 'Sat & Sun only',
  },
  {
    id: '5',
    title: 'Free Delivery',
    description: 'Free delivery on orders ₹250+',
    code: 'FREEDEL',
    icon: '🚚',
    gradient: 'linear-gradient(135deg, #8b5cf6, #9333ea, #4f46e5)',
    badge: 'FREE',
    badgeColor: 'bg-white/90 text-violet-600',
    minOrder: 'Min order ₹250',
    validTill: 'Limited time',
  },
  {
    id: '6',
    title: 'Mega Saver Pack',
    description: '₹200 off on orders ₹1000+',
    code: 'MEGA200',
    icon: '🎁',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6, #0284c7)',
    badge: 'MEGA',
    badgeColor: 'bg-yellow-400 text-yellow-900',
    minOrder: 'Min order ₹1000',
    validTill: 'Valid till 26 Jan 2027',
  },
];

function CouponCard({ coupon, index }: { coupon: CouponData; index: number }) {
  const [copied, setCopied] = useState(false);
  const { navigate } = useStore();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = coupon.code;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast({ title: 'Code copied!', description: `${coupon.code} copied to clipboard` });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShopNow = () => {
    navigate('products');
  };

  return (
    <div
      className="min-w-[300px] sm:min-w-[320px] md:min-w-[340px] flex-shrink-0 animate-fadeSlideUp"
      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'both' }}
    >
      <div
        className="relative rounded-2xl p-5 sm:p-6 h-full overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        style={{ background: coupon.gradient }}
      >
        {/* Background decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute top-1/2 right-4 -translate-y-1/2 w-20 h-20 rounded-full hidden sm:block" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Dashed divider line (coupon style) */}
        <div className="absolute left-6 top-0 bottom-0 w-px border-l border-dashed" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* Badge */}
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider mb-3 ${coupon.badgeColor}`}>
          {coupon.badge}
        </div>

        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl sm:text-3xl drop-shadow-sm">{coupon.icon}</span>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">{coupon.title}</h3>
            <p className="text-xs sm:text-sm mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{coupon.description}</p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-3 mb-4 space-y-1">
          {coupon.minOrder && (
            <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.5)' }} />
              {coupon.minOrder}
            </p>
          )}
          {coupon.validTill && (
            <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.5)' }} />
              {coupon.validTill}
            </p>
          )}
        </div>

        {/* Bottom: Code + Button */}
        <div className="flex items-center justify-between gap-3">
          {/* Coupon code */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div className="text-left">
              <p className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Use Code</p>
              <p className="text-sm sm:text-base font-bold text-white tracking-wider">{coupon.code}</p>
            </div>
            {copied ? (
              <Check className="size-4 shrink-0" style={{ color: '#86efac' }} />
            ) : (
              <Copy className="size-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
            )}
          </button>

          {/* Shop Now button */}
          <button
            onClick={handleShopNow}
            className="flex items-center gap-1.5 bg-white text-gray-900 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold hover:bg-gray-50 transition-all duration-200 shadow-sm group/btn shrink-0"
          >
            Shop Now
            <ArrowRight className="size-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CouponOffers() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #fb923c, #f59e0b)' }}>
              <Tag className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Exclusive Offers</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Save more with these amazing deals</p>
            </div>
          </div>

          {/* Scroll arrows (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Coupons scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory md:mx-0 md:px-0"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {coupons.map((coupon, index) => (
            <div key={coupon.id} className="snap-start">
              <CouponCard coupon={coupon} index={index} />
            </div>
          ))}
        </div>

        {/* Mobile swipe hint */}
        <p className="md:hidden text-center text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1.5">
          <span>Swipe to see more offers</span>
          <span className="inline-flex gap-0.5">
            <span className="w-4 h-1 rounded-full bg-gray-300" />
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="w-1 h-1 rounded-full bg-gray-300" />
          </span>
        </p>
      </div>
    </section>
  );
}
