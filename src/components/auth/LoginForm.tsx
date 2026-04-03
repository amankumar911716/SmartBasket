'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mail,
  ArrowRight,
  ShoppingCart,
  User,
  ShieldX,
  AlertTriangle,
  Phone,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  XCircle,
  WifiOff,
  Leaf,
  Truck,
  Clock,
  Shield,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { User as UserType } from '@/types';

export default function LoginForm() {
  const { login, navigate, setCartItems } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const clearErrors = () => {
    setAccountDeactivated(false);
    setUserNotFound(false);
    setWrongPassword(false);
    setConnectionError(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: 'Error', description: 'Please enter your email address', variant: 'destructive' });
      return;
    }

    if (!password.trim()) {
      toast({ title: 'Error', description: 'Please enter your password', variant: 'destructive' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    setLoading(true);
    clearErrors();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (data.id && data.email) {
        login(data as UserType);
        clearErrors();
        toast({ title: 'Welcome back!', description: `Logged in as ${data.name}` });

        // Fetch cart items for this user
        try {
          const cartRes = await fetch(`/api/cart?userId=${data.id}`);
          const cartData = await cartRes.json();
          if (Array.isArray(cartData)) {
            const enrichedItems = cartData.map((item: { id?: string; productId: string; quantity: number; product?: Record<string, unknown> }) => ({
              ...item,
              product: item.product || null,
            }));
            setCartItems(enrichedItems);
          }
        } catch {}

        navigate('home');
      } else {
        const isInactive = data.code === 'ACCOUNT_INACTIVE';
        const isNotFound = res.status === 404;
        const isInvalidCredentials = data.code === 'INVALID_CREDENTIALS';
        setAccountDeactivated(isInactive);
        setUserNotFound(isNotFound);
        setWrongPassword(isInvalidCredentials);

        toast({
          title: isInactive ? 'Account Deactivated' : isNotFound ? 'Account Not Found' : isInvalidCredentials ? 'Wrong Password' : 'Login Failed',
          description: data.error || 'An error occurred during login.',
          variant: 'destructive',
        });
      }
    } catch {
      setConnectionError(true);
      toast({ title: 'Connection Error', description: 'Unable to connect to the server. Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  const getInputBorderColor = () => {
    if (accountDeactivated) return 'border-red-300 focus-visible:ring-red-200';
    if (userNotFound) return 'border-amber-300 focus-visible:ring-amber-200';
    if (wrongPassword) return 'border-orange-400 focus-visible:ring-orange-200';
    if (connectionError) return 'border-orange-300 focus-visible:ring-orange-200';
    return '';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left branding panel - hidden on mobile */}
          <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl p-10 text-white min-h-[520px] relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 text-center max-w-sm">
              <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl">
                <img src="/logo.png" alt="SmartBasket" className="h-14 w-14 rounded-xl" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Welcome to<br /><span className="text-red-300">Smart</span><span className="text-amber-300">Basket</span></h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed mb-8">
                Your trusted grocery companion. Fresh products delivered fast to your doorstep.
              </p>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Leaf className="size-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Fresh & Organic</p>
                    <p className="text-xs text-emerald-200/70">Farm-to-door quality</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Truck className="size-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Fast Delivery</p>
                    <p className="text-xs text-emerald-200/70">2-hour express shipping</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Shield className="size-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Secure Payments</p>
                    <p className="text-xs text-emerald-200/70">UPI, Cards & COD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile branding - visible only on small screens */}
            <div className="text-center mb-8 lg:hidden">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/25 border border-green-400/20">
                <ShoppingCart className="size-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome to <span className="text-red-700">Smart</span><span className="text-amber-600">Basket</span></h1>
              <p className="text-sm text-gray-500 mt-1">Login to access your account</p>
            </div>

            {/* Desktop title */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Sign In</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
            </div>

            <Card className="border-gray-200/80 shadow-sm py-5">
              <CardContent>
                {/* Deactivated Account Warning */}
                {accountDeactivated && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <ShieldX className="size-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-red-800">Account Deactivated</h3>
                        <p className="text-xs text-red-600 mt-1.5 leading-relaxed">
                          Your account has been deactivated by an administrator. You cannot log in
                          until your account is reactivated.
                        </p>
                        <div className="flex flex-col gap-1.5 mt-3">
                          <div className="flex items-center gap-2">
                            <Phone className="size-3.5 text-red-400" />
                            <span className="text-xs text-red-500 font-medium">+91 91171 96506</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-red-400" />
                            <span className="text-xs text-red-500 font-medium">cswithaman91@gmail.com</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Not Found Warning */}
                {userNotFound && !accountDeactivated && (
                  <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="size-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-amber-800">Account Not Found</h3>
                        <p className="text-xs text-amber-600 mt-1.5 leading-relaxed">
                          No account exists with this email address. Please check your email or
                          create a new account.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wrong Password Warning */}
                {wrongPassword && !accountDeactivated && !userNotFound && (
                  <div className="mb-5 p-4 bg-orange-50 border border-orange-300 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                        <XCircle className="size-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-orange-800">Invalid Credentials</h3>
                        <p className="text-xs text-orange-600 mt-1.5 leading-relaxed">
                          The email or password you entered is incorrect. Please double-check and try again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Error Warning */}
                {connectionError && !accountDeactivated && !userNotFound && !wrongPassword && (
                  <div className="mb-5 p-4 bg-orange-50 border border-orange-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                        <WifiOff className="size-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-orange-800">Connection Error</h3>
                        <p className="text-xs text-orange-600 mt-1.5 leading-relaxed">
                          Unable to reach the server. Please check your internet connection and try again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearErrors();
                        }}
                        placeholder="you@example.com"
                        className={`pl-10 h-11 border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300 transition-all ${getInputBorderColor()}`}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearErrors();
                        }}
                        placeholder="Enter your password"
                        className={`pl-10 pr-10 h-11 border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300 transition-all ${getInputBorderColor()}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('forgot-password')}
                      className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors inline-flex items-center gap-1"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email.trim() || !password.trim()}
                    className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl text-base font-semibold shadow-lg shadow-green-600/20 transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Logging in...
                      </span>
                    ) : (
                      <>
                        Login
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    New to SmartBasket?{' '}
                    <button
                      onClick={() => navigate('register')}
                      className="text-green-600 font-semibold hover:text-green-700 transition-colors"
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
