'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Heart,
  Star,
  Crown,
  Smartphone,
  CreditCard,
  Banknote,
  Bell,
  ArrowRight,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { CATEGORY_ICONS } from '@/types';
import type { Category } from '@/types';

export default function Footer() {
  const { navigate, selectCategory } = useStore();

  // Newsletter state
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleCategoryClick = (id: string) => {
    selectCategory(id);
    navigate('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast({ title: 'Email Required', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Subscribed! 🎉', description: data.message });
        setEmail('');
        setSubscribed(true);
        setTimeout(() => setSubscribed(false), 5000);
      } else {
        toast({ title: 'Subscription Failed', description: data.message || 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not subscribe. Please try again later.', variant: 'destructive' });
    } finally {
      setSubscribing(false);
    }
  };

  const categories: Category[] = Object.entries(CATEGORY_ICONS).map(([slug, emoji], idx) => ({
    id: `cat-${idx}`,
    name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    slug,
    image: '',
    description: '',
    sortOrder: idx,
    isActive: true,
  }));

  return (
    <footer className="mt-auto bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-gray-300">
      {/* Newsletter / App Download CTA */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="bg-gradient-to-r from-green-900/40 via-emerald-800/30 to-green-900/40 rounded-2xl p-6 sm:p-8 border border-emerald-700/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Bell className="size-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Get the Best Deals</h3>
                </div>
                <p className="text-sm text-gray-400 max-w-md">
                  Subscribe to our newsletter for exclusive offers, seasonal discounts, and fresh arrivals delivered straight to your inbox.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubscribe(); }}
                    placeholder="Enter your email"
                    disabled={subscribing}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm disabled:opacity-60"
                  />
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing || subscribed}
                  className={`h-11 px-5 rounded-xl text-sm font-semibold transition-all shadow-lg shrink-0 flex items-center gap-2 ${
                    subscribed
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white cursor-default'
                      : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white hover:shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : subscribed ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Subscribed!
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="relative">
                <img src="/logo.png" alt="SmartBasket" className="h-9 w-9 rounded-xl ring-2 ring-emerald-500/30" />
              </div>
              <span className="text-lg font-bold text-white">
                <span className="text-red-500">Smart</span><span className="text-amber-400">Basket</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Your trusted online grocery store. Fresh fruits, vegetables, and daily essentials delivered to your doorstep in just 2 hours.
            </p>
            {/* Founder / Owner card */}
            <div className="mb-5 p-3.5 bg-gradient-to-br from-emerald-900/30 to-green-900/20 border border-emerald-600/15 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="size-4 text-amber-400" />
                <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Founder</span>
              </div>
              <p className="text-sm font-bold text-white tracking-wide">
                Aman Kumar
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Owned &amp; Managed with dedication
              </p>
            </div>
            <div className="flex gap-2.5">
              {[
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Youtube, label: 'YouTube' },
              ].map(({ Icon, label }) => (
                <button
                  key={label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-600 hover:border-emerald-500 transition-all duration-200 group"
                  title={label}
                >
                  <Icon className="size-4 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: 'Home', page: 'home' as const },
                { label: 'All Products', page: 'products' as const },
                { label: 'My Orders', page: 'orders' as const },
                { label: 'My Account', page: 'profile' as const },
                { label: 'My Addresses', page: 'addresses' as const },
              ].map((link) => (
                <li key={link.page}>
                  <button
                    onClick={() => { navigate(link.page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-emerald-400 transition-colors" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Categories</h3>
            <ul className="space-y-3">
              {categories.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategoryClick(cat.id)}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="text-xs group-hover:scale-110 transition-transform">{CATEGORY_ICONS[cat.slug]}</span>
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="size-4 text-emerald-400" />
                </div>
                <span className="text-sm text-gray-400 leading-relaxed">
                  98, 04, Noorsarai, Noorsarai,<br />
                  BiharSharif, Nalanda,<br />
                  Bihar, India - 803113
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Phone className="size-4 text-emerald-400" />
                </div>
                <a
                  href="tel:+919117196506"
                  className="text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                >
                  +91 91171 96506
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Mail className="size-4 text-emerald-400" />
                </div>
                <a
                  href="mailto:cswithaman91@gmail.com"
                  className="text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                >
                  cswithaman91@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-5 p-3.5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">Customer Support</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Mon - Sat, 8AM - 10PM IST
              </p>
            </div>
            <div className="mt-3 p-3.5 bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Star className="size-4 text-amber-400" />
                <span className="text-xs text-amber-400 font-semibold">Love SmartBasket?</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Rate us and help others discover fresh groceries!
              </p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2.5">We Accept</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <Smartphone className="size-4 text-blue-400" />
                  <span className="text-xs font-medium text-gray-300">UPI</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <CreditCard className="size-4 text-purple-400" />
                  <span className="text-xs font-medium text-gray-300">Card</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <Banknote className="size-4 text-green-400" />
                  <span className="text-xs font-medium text-gray-300">COD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              &copy; {new Date().getFullYear()} <span className="text-white font-medium">SmartBasket</span>. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Crown className="size-3 text-amber-400" />
              Owned &amp; Managed by{' '}
              <span className="font-semibold text-white">Aman Kumar</span>
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              Crafted with <Heart className="size-3 text-red-500 fill-red-500" /> for fresh groceries
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
