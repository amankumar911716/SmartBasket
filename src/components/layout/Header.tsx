'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  Home,
  Grid3X3,
  ClipboardList,
  UserCircle,
  Mic,
  Camera,
  X,
  Loader2,
  HelpCircle,
  Info,
  Share2,
  Star,
  MessageCircle,
  Phone,
  Heart,
} from 'lucide-react';
import LocationSelector from '@/components/layout/LocationSelector';
import ImageSearchDialog from '@/components/search/ImageSearchDialog';
import ShareAppDialog from '@/components/share/ShareAppDialog';
import { toast } from '@/hooks/use-toast';
import StarRating from '@/components/ui/StarRating';

// Voice search types (MediaRecorder approach)
type MediaRecorderInstance = {
  start: (timeslice?: number) => void;
  stop: () => void;
  state: string;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  onerror: ((e: { error: unknown }) => void) | null;
};

export default function Header() {
  const {
    navigate,
    isAuthenticated,
    user,
    logout,
    getCartCount,
    cartDrawerOpen,
    setCartDrawerOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    searchQuery,
    setSearchQuery,
    currentPage,
    setShowFeedbackForm,
  } = useStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const cartCount = getCartCount();

  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorderInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Image search dialog state
  const [showImageSearch, setShowImageSearch] = useState(false);

  // Share App dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Rate website modal state
  const [showRateModal, setShowRateModal] = useState(false);
  const [websiteRating, setWebsiteRating] = useState(0);
  const [websiteComment, setWebsiteComment] = useState('');
  const [submittingWebsiteRating, setSubmittingWebsiteRating] = useState(false);
  const [websiteRated, setWebsiteRated] = useState(false);

  // Check voice support (always show mic icon, show error on click if unsupported)
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      !!(navigator?.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined';
    setVoiceSupported(supported);
  }, []);

  // Always show mic icon — detect support on click instead of hiding
  const [showMicIcon] = useState(true);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup media recorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleSearch = useCallback((query?: string) => {
    const term = (query || searchInput).trim();
    if (!term) return;
    setSearchQuery(term);
    setSearchInput(term);
    navigate('products');
  }, [searchInput, setSearchQuery, navigate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // ========== Voice Search (MediaRecorder + Backend ASR) ==========
  const startVoiceSearch = useCallback(async () => {
    if (!voiceSupported) {
      toast({
        title: 'Voice Search Unavailable',
        description: 'Your browser does not support voice search. Try Chrome or Edge.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Stop any existing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType }) as unknown as MediaRecorderInstance;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: { data: Blob }) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          setIsListening(false);
          return;
        }

        const audioBlob = new Blob(chunks, { type: mimeType });
        setIsListening(false);

        try {
          // Convert to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(audioBlob);
          });
          const base64Audio = await base64Promise;

          // Send to backend ASR API
          toast({ title: 'Processing...', description: 'Recognizing your voice...' });
          const res = await fetch('/api/voice-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio }),
          });
          const data = await res.json();

          if (res.ok && data.success && data.text) {
            setSearchInput(data.text);
            handleSearch(data.text);
          } else {
            toast({
              title: 'Voice Search Error',
              description: data.error || 'Could not recognize speech. Please try again.',
              variant: 'destructive',
            });
          }
        } catch {
          toast({
            title: 'Voice Search Failed',
            description: 'Could not process audio. Please try again.',
            variant: 'destructive',
          });
        }
      };

      recorder.onerror = () => {
        setIsListening(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        toast({
          title: 'Microphone Error',
          description: 'Could not record audio. Please check your microphone.',
          variant: 'destructive',
        });
      };

      // Start recording (collect data every second)
      recorder.start(1000);
      setIsListening(true);
      toast({
        title: 'Listening...',
        description: 'Speak the product name you want to search for.',
      });

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch (err) {
      setIsListening(false);
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone permission in your browser settings.'
        : 'Could not access microphone. Please check your device settings.';
      toast({
        title: 'Microphone Access Denied',
        description: msg,
        variant: 'destructive',
      });
    }
  }, [voiceSupported, handleSearch]);

  const stopVoiceSearch = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ========== Image Search Dialog ==========
  const handleImageSearchResult = useCallback((kw: string[], items: string[]) => {
    const searchTerm = kw.slice(0, 3).join(' ');
    setSearchInput(searchTerm);
    handleSearch(searchTerm);
    toast({
      title: 'Items Found!',
      description: `We found: ${items.join(', ') || searchTerm}. Searching products...`,
    });
  }, [handleSearch]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('home');
    toast({ title: 'Logged out successfully' });
  };



  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 text-white shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
        {/* Subtle bottom highlight */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
        
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/15 transition-all duration-200"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>

            {/* Logo + 3-line menu */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-2 group"
              >
                <div className="relative">
                  <img src="/logo.png" alt="SmartBasket" className="h-9 w-9 rounded-xl object-cover shadow-md ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
                </div>
                <span className="text-lg font-bold tracking-tight hidden sm:block">
                  <span className="text-red-400">Smart</span><span className="text-amber-300">Basket</span>
                </span>
              </button>

              {/* 3-line More menu button — next to logo */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ml-0.5 ${
                    showMoreMenu
                      ? 'bg-white/25 ring-1 ring-white/30'
                      : 'hover:bg-white/15 active:bg-white/20'
                  }`}
                  aria-label="More options"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
                    <rect x="1" y="2" width="14" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="1" y="7.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="1" y="12.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
                  </svg>
                </button>

                {showMoreMenu && (
                  <div className="absolute left-0 top-full mt-2.5 w-56 bg-white rounded-xl shadow-2xl shadow-black/12 border border-gray-100 py-1.5 text-gray-700 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden z-50">
                    <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50 to-amber-50/30 border-b border-gray-100">
                      <p className="font-semibold text-xs text-gray-900">Quick Actions</p>
                    </div>

                    <button
                      onClick={() => { navigate('home'); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Home className="size-4 text-gray-400" />
                      Go to Home
                    </button>

                    {isAuthenticated && (
                      <button
                        onClick={() => { navigate('orders'); setShowMoreMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Package className="size-4 text-gray-400" />
                        My Orders
                      </button>
                    )}

                    <button
                      onClick={() => { navigate('products'); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Grid3X3 className="size-4 text-gray-400" />
                      Browse Products
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        toast({
                          title: 'Support',
                          description: '📞 +91 91171 96506  |  ✉️ cswithaman91@gmail.com',
                        });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="size-4 text-gray-400" />
                      Contact Support
                    </button>

                    <button
                      onClick={() => { navigate('help'); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <HelpCircle className="size-4 text-gray-400" />
                      Help & FAQ
                    </button>

                    <button
                      onClick={() => { setShowFeedbackForm(true); navigate('help'); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="size-4 text-gray-400" />
                      Send Feedback
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={() => { setShowMoreMenu(false); setShowShareDialog(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="size-4 text-gray-400" />
                      Share App
                    </button>

                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowRateModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Star className="size-4 text-gray-400" />
                      Rate SmartBasket
                    </button>

                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        toast({
                          title: 'About SmartBasket',
                          description: 'Your one-stop shop for fresh groceries, delivered to your doorstep! 🛒\n\n👑 Founded by Aman Kumar',
                        });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Info className="size-4 text-gray-400" />
                      About
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Search bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-auto hidden md:flex items-center gap-2.5">
              {/* Location selector */}
              <LocationSelector variant="desktop" />
              
              <div className="relative w-full group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none group-focus-within:text-green-600 transition-colors" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for fruits, vegetables, groceries..."
                  className="pl-10 pr-[7.5rem] h-10 rounded-full bg-white/95 backdrop-blur-md text-gray-800 border border-gray-200/50 shadow-lg shadow-black/5 focus-visible:ring-2 focus-visible:ring-green-400/50 focus-visible:border-green-300 placeholder:text-gray-400 transition-all"
                />

                {/* Voice search button */}
                {showMicIcon && (
                  <button
                    type="button"
                    onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                    className={`absolute right-[4.2rem] top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice search'}
                  >
                    {isListening ? (
                      <X className="size-3.5" />
                    ) : (
                      <Mic className="size-3.5" />
                    )}
                  </button>
                )}

                {/* Image search button */}
                <button
                  type="button"
                  onClick={() => setShowImageSearch(true)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                  title="Search by image"
                >
                  <Camera className="size-3.5" />
                </button>
              </div>
            </form>

            {/* Right side actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Cart */}
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2.5 rounded-full hover:bg-white/15 transition-all duration-200 group"
              >
                <ShoppingCart className="size-5 group-hover:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white border-2 border-green-600 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
              </button>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-2 rounded-full hover:bg-white/15 transition-all duration-200"
                >
                  <User className="size-5" />
                  {isAuthenticated && (
                    <ChevronDown className={`size-3 hidden sm:block transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2.5 w-60 bg-white rounded-xl shadow-2xl shadow-black/10 border border-gray-100 py-1.5 text-gray-700 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-emerald-50/50 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                            {user?.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
                                <span className="size-1.5 rounded-full bg-red-500" />
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
                        </div>
                        <button
                          onClick={() => { navigate('profile'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <UserCircle className="size-4 text-gray-400" />
                          My Profile
                        </button>
                        <button
                          onClick={() => { navigate('orders'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Package className="size-4 text-gray-400" />
                          My Orders
                        </button>
                        <button
                          onClick={() => { navigate('addresses'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <ClipboardList className="size-4 text-gray-400" />
                          My Addresses
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => { navigate('admin'); setShowUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors text-emerald-600 font-semibold bg-emerald-50/50"
                          >
                            <Settings className="size-4" />
                            Admin Panel
                          </button>
                        )}
                        <div className="border-t mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors text-red-600"
                          >
                            <LogOut className="size-4" />
                            Logout
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { navigate('login'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <User className="size-4 text-gray-400" />
                          Login
                        </button>
                        <button
                          onClick={() => { navigate('register'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <UserCircle className="size-4 text-gray-400" />
                          Register
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          <form onSubmit={handleSearchSubmit} className="md:hidden pb-3">
            <div className="flex items-center gap-2">
              <LocationSelector variant="mobile" />
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search groceries..."
                  className="pl-9 pr-[6.5rem] h-9 rounded-full bg-white/95 backdrop-blur-md text-gray-800 border border-gray-200/50 shadow-lg shadow-black/5 focus-visible:ring-2 focus-visible:ring-green-400/50 focus-visible:border-green-300 placeholder:text-gray-400 transition-all"
                />

                {/* Mobile voice search */}
                {showMicIcon && (
                  <button
                    type="button"
                    onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                    className={`absolute right-[3.5rem] top-1/2 -translate-y-1/2 p-1 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={isListening ? 'Stop' : 'Voice search'}
                  >
                    {isListening ? (
                      <X className="size-3.5" />
                    ) : (
                      <Mic className="size-3.5" />
                    )}
                  </button>
                )}

                {/* Mobile image search */}
                <button
                  type="button"
                  onClick={() => setShowImageSearch(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                  title="Search by image"
                >
                  <Camera className="size-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </header>

      {/* Image Search Dialog */}
      <ImageSearchDialog
        open={showImageSearch}
        onOpenChange={setShowImageSearch}
        onSearchResult={handleImageSearchResult}
      />

      {/* Share App Dialog */}
      <ShareAppDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />

      {/* Voice search overlay indicator */}
      {isListening && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 p-5 flex flex-col items-center gap-3 min-w-[260px] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center ring-4 ring-red-100">
              <Mic className="size-7 text-red-500" />
            </div>
            <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-30" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Listening...</p>
            <p className="text-xs text-gray-500 mt-0.5">Speak the product name</p>
          </div>
          {searchInput && (
            <p className="text-xs text-green-600 font-medium max-w-[220px] truncate px-2 bg-green-50 rounded-lg py-1">
              &quot;{searchInput}&quot;
            </p>
          )}
          <button
            onClick={stopVoiceSearch}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors underline underline-offset-2"
          >
            Tap to cancel
          </button>
        </div>
      )}



      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex items-center justify-around py-1.5 px-2">
          <button
            onClick={() => navigate('home')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
              currentPage === 'home'
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {currentPage === 'home' && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-green-500 shadow-sm shadow-green-500" />
            )}
            {currentPage === 'home' && (
              <div className="absolute inset-0 bg-green-50 rounded-2xl" />
            )}
            <Home className={`size-5 relative z-10 ${currentPage === 'home' ? 'drop-shadow-sm' : ''}`} />
            <span className="text-[10px] font-semibold relative z-10">Home</span>
          </button>
          <button
            onClick={() => navigate('products')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
              currentPage === 'products'
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {currentPage === 'products' && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-green-500 shadow-sm shadow-green-500" />
            )}
            {currentPage === 'products' && (
              <div className="absolute inset-0 bg-green-50 rounded-2xl" />
            )}
            <Grid3X3 className={`size-5 relative z-10 ${currentPage === 'products' ? 'drop-shadow-sm' : ''}`} />
            <span className="text-[10px] font-semibold relative z-10">Categories</span>
          </button>
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 text-gray-400 relative"
          >
            <div className="relative">
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5 shadow-sm font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Cart</span>
          </button>
          <button
            onClick={() => navigate('orders')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
              currentPage === 'orders' || currentPage === 'order-detail'
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {(currentPage === 'orders' || currentPage === 'order-detail') && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-green-500 shadow-sm shadow-green-500" />
            )}
            {(currentPage === 'orders' || currentPage === 'order-detail') && (
              <div className="absolute inset-0 bg-green-50 rounded-2xl" />
            )}
            <Package className={`size-5 relative z-10 ${currentPage === 'orders' || currentPage === 'order-detail' ? 'drop-shadow-sm' : ''}`} />
            <span className="text-[10px] font-semibold relative z-10">Orders</span>
          </button>
          {/* 3-line More button in bottom nav */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
              showMoreMenu
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {showMoreMenu && (
              <div className="absolute inset-0 bg-green-50 rounded-2xl" />
            )}
            <div className={`relative z-10 w-5 h-5 flex flex-col justify-center items-center gap-[3px] transition-transform duration-200 ${showMoreMenu ? 'rotate-90' : ''}`}>
              <span className="block w-[14px] h-[2px] rounded-full bg-current" />
              <span className="block w-[14px] h-[2px] rounded-full bg-current" />
              <span className="block w-[14px] h-[2px] rounded-full bg-current" />
            </div>
            <span className="text-[10px] font-semibold relative z-10">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More menu overlay (bottom sheet style) */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setShowMoreMenu(false)}
          />
          {/* Bottom sheet */}
          <div className="fixed bottom-16 left-3 right-3 z-50 md:hidden bg-white rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="px-4 py-2 border-b border-gray-100">
              <p className="font-semibold text-sm text-gray-900">Quick Actions</p>
              <p className="text-xs text-gray-400">SmartBasket at your fingertips</p>
            </div>

            <div className="max-h-[50vh] overflow-y-auto py-1">
              <button
                onClick={() => { navigate('home'); setShowMoreMenu(false); }}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <Home className="size-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Go to Home</p>
                  <p className="text-xs text-gray-400">Browse featured products</p>
                </div>
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => { navigate('orders'); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Package className="size-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">My Orders</p>
                    <p className="text-xs text-gray-400">Track & manage orders</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => { navigate('products'); setShowMoreMenu(false); }}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Grid3X3 className="size-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Browse Products</p>
                  <p className="text-xs text-gray-400">Explore all categories</p>
                </div>
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => { navigate('addresses'); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                    <ClipboardList className="size-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">My Addresses</p>
                    <p className="text-xs text-gray-400">Manage delivery addresses</p>
                  </div>
                </button>
              )}

              <div className="border-t border-gray-100 mx-4 my-1" />

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  toast({
                    title: 'Support',
                    description: 'Call us at 1800-123-4567 or email support@smartbasket.in',
                  });
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <Phone className="size-4 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Contact Support</p>
                  <p className="text-xs text-gray-400">We're here to help 24/7</p>
                </div>
              </button>

              <button
                onClick={() => { navigate('help'); setShowMoreMenu(false); }}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <HelpCircle className="size-4 text-teal-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Help & FAQ</p>
                  <p className="text-xs text-gray-400">Policies, shipping & more</p>
                </div>
              </button>

              <button
                onClick={() => { setShowFeedbackForm(true); navigate('help'); setShowMoreMenu(false); }}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <MessageCircle className="size-4 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Send Feedback</p>
                  <p className="text-xs text-gray-400">Help us improve</p>
                </div>
              </button>

              <div className="border-t border-gray-100 mx-4 my-1" />

              <button
                onClick={() => { setShowMoreMenu(false); setShowShareDialog(true); }}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Share2 className="size-4 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Share App</p>
                  <p className="text-xs text-gray-400">Share with friends & family</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowRateModal(true);
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="size-4 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Rate SmartBasket</p>
                  <p className="text-xs text-gray-400">Love us? Let us know!</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  toast({
                    title: 'About SmartBasket',
                    description: 'Your one-stop shop for fresh groceries, delivered to your doorstep! 🛒\n\n👑 Founded by Aman Kumar',
                  });
                }}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Info className="size-4 text-gray-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">About</p>
                  <p className="text-xs text-gray-400">Version 1.0 • Made with ❤️</p>
                </div>
              </button>
            </div>

            {/* Bottom safe area */}
            <div className="h-3 bg-gradient-to-t from-gray-50 to-transparent" />
          </div>
        </>
      )}

      {/* ===== RATE WEBSITE MODAL ===== */}
      {showRateModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRateModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-300 z-10">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="px-6 pt-4 pb-3 sm:pt-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <Star className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Rate SmartBasket</h3>
                    <p className="text-xs text-gray-400">How is your experience?</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRateModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {websiteRated ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <Heart className="size-8 text-green-500" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-1">Thank You! 🎉</h4>
                  <p className="text-sm text-gray-500">Your feedback means the world to us. We&apos;ll keep improving!</p>
                  <button
                    onClick={() => setShowRateModal(false)}
                    className="mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Stars */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-3">Tap a star to rate</p>
                    <div className="flex justify-center">
                      <StarRating
                        rating={websiteRating}
                        interactive
                        onRate={setWebsiteRating}
                        size="xl"
                      />
                    </div>
                    {websiteRating > 0 && (
                      <p className="text-sm font-semibold mt-2 text-amber-600">
                        {websiteRating === 1 ? 'Poor 😞' : websiteRating === 2 ? 'Fair 😐' : websiteRating === 3 ? 'Good 🙂' : websiteRating === 4 ? 'Great 😊' : 'Love it! 🤩'}
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Your Feedback <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={websiteComment}
                      onChange={(e) => setWebsiteComment(e.target.value)}
                      placeholder="What do you like most about SmartBasket? Any suggestions?"
                      className="w-full min-h-[80px] resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200/50 focus:border-amber-300 transition-all"
                      maxLength={300}
                    />
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-400">{websiteComment.length}/300</span>
                    </div>
                  </div>

                  {!isAuthenticated && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 text-center">
                      Login to submit your website rating
                    </p>
                  )}

                  {/* Submit */}
                  <Button
                    onClick={async () => {
                      if (!isAuthenticated) {
                        toast({ title: 'Login Required', description: 'Please login to rate SmartBasket.', variant: 'destructive' });
                        return;
                      }
                      if (websiteRating === 0) {
                        toast({ title: 'Select Rating', description: 'Please tap a star to rate.', variant: 'destructive' });
                        return;
                      }
                      setSubmittingWebsiteRating(true);
                      try {
                        const res = await fetch('/api/website/rate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user?.id,
                            rating: websiteRating,
                            comment: websiteComment.trim(),
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setWebsiteRated(true);
                          toast({ title: 'Thanks for Rating! ⭐', description: `You rated SmartBasket ${websiteRating}/5` });
                        } else {
                          toast({ title: 'Error', description: data.message || 'Failed to submit rating.', variant: 'destructive' });
                        }
                      } catch {
                        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
                      } finally {
                        setSubmittingWebsiteRating(false);
                      }
                    }}
                    disabled={submittingWebsiteRating || websiteRating === 0}
                    className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-amber-500/20 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
                  >
                    {submittingWebsiteRating ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Rating'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
