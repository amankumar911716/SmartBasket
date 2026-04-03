'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Truck,
  RotateCcw,
  Shield,
  FileText,
  ChevronDown,
  Crown,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  User,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Policy data                                                        */
/* ------------------------------------------------------------------ */

interface PolicySection {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  content: React.ReactNode;
}

const policies: PolicySection[] = [
  {
    id: 'shipping',
    icon: Truck,
    title: 'Shipping Policy',
    subtitle: 'Delivery timelines, charges & packaging info',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    content: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p className="text-gray-700 font-medium">
          At <span className="font-bold text-gray-800">SmartBasket</span>, we are committed to delivering your orders in a timely and efficient manner.
        </p>
        <ul className="space-y-2.5">
          {[
            'Orders are processed within 12–24 hours of confirmation.',
            'Delivery timelines typically range between 1–3 business days, depending on your location.',
            'Same-day or next-day delivery may be available in select areas.',
            'Free delivery is applicable on orders above ₹500 (subject to change).',
            'Delivery charges, if any, will be clearly displayed at checkout.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-amber-800 text-xs leading-relaxed">
            In case of delays due to weather conditions, high demand, or operational issues, customers will be informed via SMS or email.
          </p>
        </div>
        <p className="text-gray-600">
          SmartBasket ensures <span className="font-semibold text-gray-800">safe packaging and handling</span> of all products, especially perishable items.
        </p>
      </div>
    ),
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: 'Return & Refund Policy',
    subtitle: 'Return window, eligibility & refund methods',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    content: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p className="text-gray-700 font-medium">Customer satisfaction is our top priority.</p>
        <ul className="space-y-2.5">
          {[
            'Customers may request a return within 24 hours of delivery.',
            'Products must be unused, undamaged, and in original packaging.',
            'Perishable items (fruits, vegetables, dairy) are only eligible for return if received in damaged or spoiled condition.',
            'Refunds will be processed within 5–7 business days after approval.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div>
          <p className="font-semibold text-gray-800 mb-2">Refund Methods:</p>
          <ul className="space-y-2.5">
            <li className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              <span><span className="font-medium text-gray-700">UPI / Card / Net Banking:</span> Amount will be credited to the original payment method.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              <span><span className="font-medium text-gray-700">Cash on Delivery (COD):</span> Refund will be processed via bank transfer or wallet.</span>
            </li>
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-gray-600 text-xs leading-relaxed">
            SmartBasket reserves the right to reject return requests that do not meet the above conditions.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy Policy',
    subtitle: 'How we protect your data & privacy',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    content: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p className="text-gray-700 font-medium">
          At SmartBasket, we respect your privacy and are committed to protecting your personal information in compliance with applicable Indian laws.
        </p>
        <ul className="space-y-2.5">
          {[
            'We collect personal data such as name, mobile number, email address, and delivery address.',
            'This information is used for order processing, delivery, customer support, and service improvement.',
            'We do not sell, rent, or share your personal data with third parties without your consent, except as required for service fulfillment.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div>
          <p className="font-semibold text-gray-800 mb-2">Security:</p>
          <ul className="space-y-2.5">
            <li className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              We use secure servers and encryption to protect your data.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              Payment information is processed through trusted and secure payment gateways.
            </li>
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-blue-800 text-xs leading-relaxed">
            By using our platform, you consent to our data practices as outlined in this policy.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'terms',
    icon: FileText,
    title: 'Terms & Conditions',
    subtitle: 'Usage terms, governing law & more',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    content: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p className="text-gray-700 font-medium">
          By accessing and using SmartBasket, you agree to comply with the following terms:
        </p>
        <ul className="space-y-2.5">
          {[
            'All orders are subject to availability and confirmation.',
            'Prices, discounts, and offers may change without prior notice.',
            'Users must provide accurate and complete information during registration and checkout.',
            'SmartBasket reserves the right to cancel or refuse any order due to pricing errors, stock issues, or suspicious activity.',
            'Misuse of the platform, including fraudulent transactions, may result in account suspension or termination.',
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div>
          <p className="font-semibold text-gray-800 mb-2">Governing Law:</p>
          <p className="flex gap-2.5">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            These terms shall be governed by and interpreted in accordance with the laws of India.
          </p>
        </div>
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <p className="text-purple-800 text-xs leading-relaxed">
            Continued use of the platform constitutes acceptance of these terms and conditions.
          </p>
        </div>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Feedback type options                                              */
/* ------------------------------------------------------------------ */

const FEEDBACK_TYPES = [
  { value: 'general', label: 'General Feedback', emoji: '💬' },
  { value: 'suggestion', label: 'Suggestion', emoji: '💡' },
  { value: 'complaint', label: 'Complaint', emoji: '⚠️' },
  { value: 'compliment', label: 'Compliment', emoji: '🌟' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HelpCenter() {
  const { navigate, showFeedbackForm, setShowFeedbackForm, user } = useStore();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['shipping']));
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Feedback form state
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbType, setFbType] = useState('general');
  const [fbMessage, setFbMessage] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSubmitted, setFbSubmitted] = useState(false);

  // Pre-fill name/email from logged-in user
  useEffect(() => {
    if (user?.name && !fbName) setFbName(user.name);
    if (user?.email && !fbEmail) setFbEmail(user.email);
  }, [user?.name, user?.email]);

  // Auto-scroll to feedback form when flag is set
  useEffect(() => {
    if (showFeedbackForm && feedbackRef.current) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      setShowFeedbackForm(false);
    }
  }, [showFeedbackForm, setShowFeedbackForm]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmitFeedback = async () => {
    const trimmedName = fbName.trim();
    const trimmedMessage = fbMessage.trim();

    if (!trimmedName || trimmedName.length < 2) {
      toast({ title: 'Name Required', description: 'Please enter your name (at least 2 characters).', variant: 'destructive' });
      return;
    }

    if (fbEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fbEmail.trim())) {
        toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
        return;
      }
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      toast({ title: 'Message Too Short', description: 'Please write at least 10 characters.', variant: 'destructive' });
      return;
    }

    setFbSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: fbEmail.trim(),
          type: fbType,
          message: trimmedMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Feedback Sent! 🎉', description: data.message });
        setFbMessage('');
        setFbSubmitted(true);
        setTimeout(() => setFbSubmitted(false), 6000);
      } else {
        toast({ title: 'Failed', description: data.message || 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not send feedback. Please try again.', variant: 'destructive' });
    } finally {
      setFbSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 md:pb-8">
      {/* Back button + header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('home')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="size-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Help Center</h1>
          <p className="text-sm text-gray-500">Policies, support & feedback</p>
        </div>
      </div>

      {/* Contact Support Card */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/60">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MessageCircle className="size-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Need Help?</p>
            <p className="text-xs text-gray-500">We&apos;re here for you</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="tel:+919117196506"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
              <Phone className="size-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Call Us</p>
              <p className="text-sm font-medium text-gray-800">+91 91171 96506</p>
            </div>
          </a>
          <a
            href="mailto:cswithaman91@gmail.com"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
              <Mail className="size-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email Us</p>
              <p className="text-sm font-medium text-gray-800 truncate">cswithaman91@gmail.com</p>
            </div>
          </a>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <Crown className="size-3 text-amber-500" />
          <span>Customer Support: Mon – Sat, 8AM – 10PM IST</span>
        </div>
      </div>

      {/* Policy Sections (Accordion) */}
      <div className="space-y-3">
        {policies.map((policy) => {
          const isOpen = openSections.has(policy.id);
          const Icon = policy.icon;
          return (
            <div
              key={policy.id}
              className={`rounded-2xl border transition-all duration-200 ${
                isOpen
                  ? 'border-gray-200 shadow-sm bg-white'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <button
                onClick={() => toggleSection(policy.id)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-left"
              >
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${policy.bgColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`size-5 ${policy.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">{policy.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{policy.subtitle}</p>
                </div>
                <ChevronDown
                  className={`size-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-0">
                  <div className="border-t border-gray-100 pt-4">
                    {policy.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ============ Feedback Form Section ============ */}
      <div ref={feedbackRef} className="mt-10 scroll-mt-20">
        <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-green-50/20 overflow-hidden">
          {/* Header */}
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Send className="size-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Send Feedback</h2>
                <p className="text-xs text-gray-500">We value your opinion — help us improve!</p>
              </div>
            </div>
          </div>

          {fbSubmitted ? (
            /* Success state */
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <p className="font-semibold text-gray-800 text-lg mb-1">Thank You!</p>
              <p className="text-sm text-gray-500 max-w-xs">
                Your feedback has been submitted successfully. We&apos;ll review it and work to make SmartBasket even better.
              </p>
            </div>
          ) : (
            /* Form */
            <div className="p-5 sm:p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Your Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={fbName}
                    onChange={(e) => setFbName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={fbSubmitting}
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-300 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Email (optional) */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={fbEmail}
                    onChange={(e) => setFbEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={fbSubmitting}
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-300 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Feedback Type */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FEEDBACK_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setFbType(ft.value)}
                      disabled={fbSubmitting}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        fbType === ft.value
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-60`}
                    >
                      <span>{ft.emoji}</span>
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Your Feedback <span className="text-red-500">*</span></label>
                <textarea
                  value={fbMessage}
                  onChange={(e) => setFbMessage(e.target.value)}
                  placeholder="Tell us what you think... (min 10 characters)"
                  rows={4}
                  disabled={fbSubmitting}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-300 transition-all resize-none disabled:opacity-60"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">
                  {fbMessage.length}/1000
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitFeedback}
                disabled={fbSubmitting}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {fbSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400 leading-relaxed">
          Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          © SmartBasket · All rights reserved
        </p>
      </div>
    </div>
  );
}
