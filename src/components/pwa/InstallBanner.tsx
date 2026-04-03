'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  WifiOff,
  Share2,
  Plus,
  MonitorSmartphone,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallBannerProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isStandalone: boolean;
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
}

/* ─── Platform Detection ─── */
type Platform = 'chrome-android' | 'chrome-desktop' | 'safari-ios' | 'edge-desktop' | 'other-mobile' | 'other-desktop';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'other-desktop';
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/.test(ua);
  if (isIOS && isSafari) return 'safari-ios';
  if (isIOS) return 'safari-ios';
  if (isChrome && isMobile) return 'chrome-android';
  if (isEdge && !isMobile) return 'edge-desktop';
  if (isChrome && !isMobile) return 'chrome-desktop';
  if (isMobile) return 'other-mobile';
  return 'other-desktop';
}

function getSteps(platform: Platform): string[] {
  switch (platform) {
    case 'chrome-android':
      return ['Tap "Install" below', 'Confirm in popup', 'Open from Home Screen'];
    case 'safari-ios':
      return ['Tap Share icon (Safari)', 'Select "Add to Home Screen"', 'Tap "Add" to install'];
    case 'chrome-desktop':
    case 'edge-desktop':
      return ['Click "Install" below', 'Confirm in dialog', 'Launch from Desktop'];
    default:
      return ['Click "Install" below', 'Follow the prompt', 'Open from Home Screen'];
  }
}

export default function InstallBanner({
  isInstallable,
  isInstalled,
  isOffline,
  isStandalone,
  onInstall,
  onDismiss,
}: InstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const steps = useMemo(() => getSteps(detectPlatform()), []);
  const canDirectInstall = detectPlatform() !== 'safari-ios' && detectPlatform() !== 'other-mobile';

  // Show small widget after delay (only on home, not standalone)
  useEffect(() => {
    if (isStandalone || isInstalled) return;
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('sb-install-popup-dismissed');
      if (dismissed) {
        const expiry = parseInt(dismissed, 10);
        if (Date.now() < expiry) return;
      }
      setIsVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isStandalone]);

  // Auto-dismiss success after 5s
  useEffect(() => {
    if (!showSuccess) return;
    const id = setTimeout(() => setShowSuccess(false), 5000);
    return () => clearTimeout(id);
  }, [showSuccess]);

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await onInstall();
    setInstalling(false);
    if (accepted) {
      setShowSuccess(true);
      setExpanded(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setExpanded(false);
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('sb-install-popup-dismissed', expiry.toString());
    onDismiss();
  };

  /* ─── Offline indicator ─── */
  if (isOffline && !isStandalone) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-20 md:bottom-4 right-3 md:right-4 z-50"
      >
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 shadow-lg shadow-amber-500/10">
          <WifiOff className="size-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-800">You&apos;re Offline</span>
        </div>
      </motion.div>
    );
  }

  /* ─── Success indicator ─── */
  if (showSuccess) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="fixed bottom-20 md:bottom-4 right-3 md:right-4 z-50"
      >
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-800">App Installed!</span>
        </div>
      </motion.div>
    );
  }

  /* ─── Main: Small floating widget (bottom-right, above footer/mobile-nav) ─── */
  if (!isVisible || isStandalone) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-20 md:bottom-5 right-3 md:right-5 z-50"
        >
          {/* Expanded panel */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full right-0 mb-2.5 w-[260px] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-4 pt-4 pb-5 relative">
                  <button
                    onClick={handleDismiss}
                    className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                    aria-label="Close"
                  >
                    <X className="size-3" />
                  </button>

                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <img src="/icons/icon-192.png" alt="SB" className="w-7 h-7 rounded-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">Install App</p>
                      <p className="text-[10px] text-white/75">Faster ordering &amp; offline mode</p>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[9px] font-medium text-white">
                      <Zap className="size-2.5" /> Fast
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[9px] font-medium text-white">
                      <Shield className="size-2.5" /> Secure
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[9px] font-medium text-white">
                      <Clock className="size-2.5" /> Offline
                    </span>
                  </div>
                </div>

                {/* Steps */}
                <div className="px-4 pt-3.5 pb-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    How to install
                  </p>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-md bg-green-50 border border-green-100 text-green-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Install button */}
                <div className="px-4 pb-4">
                  {canDirectInstall ? (
                    <button
                      onClick={handleInstall}
                      disabled={installing}
                      className="w-full h-9 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-green-600/20 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                      {installing ? (
                        <>
                          <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Installing...
                        </>
                      ) : (
                        <>
                          <Download className="size-3.5" />
                          Install Now
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setExpanded(false); }}
                      className="w-full h-9 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-green-600/20"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Got It!
                    </button>
                  )}
                  <button
                    onClick={handleDismiss}
                    className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 mt-1.5 py-1 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed: small floating pill button */}
          {!expanded && (
            <motion.button
              onClick={() => setExpanded(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white pl-3 pr-2.5 py-2 rounded-full shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-shadow"
            >
              <Download className="size-3.5 shrink-0" />
              <span className="text-xs font-bold whitespace-nowrap">Install App</span>
              <ChevronUp className="size-3 opacity-70" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
