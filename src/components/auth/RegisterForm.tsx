'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mail,
  User,
  Phone,
  ArrowRight,
  ShoppingCart,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Leaf,
  Truck,
  Shield,
  Award,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { User as UserType } from '@/types';

export default function RegisterForm() {
  const { login, navigate } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordLongEnough = password.length >= 6;
  const isValidEmail = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = phone.length === 0 || /^[0-9]{10}$/.test(phone.replace(/\s/g, ''));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters long', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Password and confirm password do not match', variant: 'destructive' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (data.user) {
        login(data.user as UserType);
        toast({ title: 'Account created!', description: `Welcome to SmartBasket, ${data.user.name}` });
        navigate('home');
      } else {
        toast({
          title: 'Registration failed',
          description: data.error || 'Could not create account. Email may already exist.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to register. Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left branding panel - hidden on mobile */}
          <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl p-10 text-white min-h-[580px] relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/3 left-0 w-32 h-32 bg-white/3 rounded-full -translate-x-1/2" />
            
            <div className="relative z-10 text-center max-w-sm">
              <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl">
                <img src="/logo.png" alt="SmartBasket" className="h-14 w-14 rounded-xl" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Join <span className="text-red-300">Smart</span><span className="text-amber-300">Basket</span></h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed mb-8">
                Create an account and enjoy fresh groceries delivered to your doorstep in minutes.
              </p>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Leaf className="size-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Farm Fresh Quality</p>
                    <p className="text-xs text-emerald-200/70">Handpicked products daily</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Truck className="size-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">2-Hour Delivery</p>
                    <p className="text-xs text-emerald-200/70">Fast & free above &#8377;500</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Award className="size-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Best Prices</p>
                    <p className="text-xs text-emerald-200/70">Save up to 30% everyday</p>
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
              <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
              <p className="text-sm text-gray-500 mt-1">Join <span className="text-red-700">Smart</span><span className="text-amber-600">Basket</span> and start shopping</p>
            </div>

            {/* Desktop title */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
              <p className="text-sm text-gray-500 mt-1">Fill in your details to get started</p>
            </div>

            <Card className="border-gray-200/80 shadow-sm py-5">
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-10 h-11 border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`pl-10 pr-9 h-11 border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300 transition-all ${
                          email.length > 0 && !isValidEmail ? 'border-red-300 focus-visible:ring-red-100' : ''
                        }`}
                      />
                      {email.length > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isValidEmail ? (
                            <CheckCircle2 className="size-4 text-green-500" />
                          ) : (
                            <XCircle className="size-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className={`pl-10 pr-9 h-11 border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300 transition-all ${
                          phone.length > 0 && !isValidPhone ? 'border-red-300 focus-visible:ring-red-100' : ''
                        }`}
                      />
                      {phone.length > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isValidPhone ? (
                            <CheckCircle2 className="size-4 text-green-500" />
                          ) : (
                            <XCircle className="size-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {phone.length > 0 && phone.length < 10 && (
                      <p className="text-xs text-amber-500 mt-1">{10 - phone.length} more digits needed</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className={`pl-10 pr-10 h-11 transition-all ${
                          password.length > 0 && !passwordLongEnough
                            ? 'border-red-300 focus-visible:ring-red-100'
                            : passwordLongEnough
                            ? 'border-green-300 focus-visible:ring-green-100 focus-visible:border-green-300'
                            : 'border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300'
                        }`}
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
                    {/* Password strength bar */}
                    {password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          <div className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= 2 ? 'bg-red-400' : 'bg-gray-200'
                          }`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= 4 ? 'bg-amber-400' : 'bg-gray-200'
                          }`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordLongEnough ? 'bg-green-400' : 'bg-gray-200'
                          }`} />
                        </div>
                        {!passwordLongEnough && (
                          <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className={`pl-10 pr-10 h-11 transition-all ${
                          confirmPassword.length > 0 && !passwordsMatch
                            ? 'border-red-300 focus-visible:ring-red-100'
                            : passwordsMatch
                            ? 'border-green-300 focus-visible:ring-green-100 focus-visible:border-green-300'
                            : 'border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && passwordsMatch && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <CheckCircle2 className="size-3.5 text-green-500" />
                        <p className="text-xs text-green-600 font-medium">Passwords match</p>
                      </div>
                    )}
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <XCircle className="size-3.5 text-red-400" />
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !name.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim() || !passwordLongEnough || !passwordsMatch}
                    className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl text-base font-semibold shadow-lg shadow-green-600/20 transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-5 text-center space-y-2">
                  <button
                    onClick={() => navigate('forgot-password')}
                    className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors inline-flex items-center gap-1"
                  >
                    Forgot Password?
                  </button>
                  <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <button
                      onClick={() => navigate('login')}
                      className="text-green-600 font-semibold hover:text-green-700 transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-gray-400 text-center mt-6">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
