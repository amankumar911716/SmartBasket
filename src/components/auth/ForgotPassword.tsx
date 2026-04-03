'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Mail,
  Phone,
  ShoppingCart,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Smartphone,
  Info,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Step = 'enter-identifier' | 'verify-otp' | 'set-password' | 'success';

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
}

function OtpInput({ length = 6, value, onChange, disabled, error }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (char.length > 1) {
      // Handle paste
      const pasteChars = char.slice(0, length);
      const newValue = (value + pasteChars).slice(0, length);
      onChange(newValue);
      const focusIndex = Math.min(pasteChars.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(char)) return;

    const newValue = value.slice(0, index) + char + value.slice(index + 1);
    onChange(newValue);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newValue = value.slice(0, index - 1) + value.slice(index);
        onChange(newValue);
      } else {
        const newValue = value.slice(0, index) + value.slice(index + 1);
        onChange(newValue);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasteData);
    const focusIndex = Math.min(pasteData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={length}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={i === 0}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none ${
            error
              ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-400 focus:ring-2 focus:ring-red-100'
              : value[i]
              ? 'border-green-400 bg-green-50 text-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-100'
              : 'border-gray-200 bg-white text-gray-800 focus:border-green-400 focus:ring-2 focus:ring-green-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
          aria-label={`Digit ${i + 1} of ${length}`}
        />
      ))}
    </div>
  );
}

export default function ForgotPassword() {
  const { navigate } = useStore();

  // Step state
  const [step, setStep] = useState<Step>('enter-identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [maskedId, setMaskedId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [generalError, setGeneralError] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const clearErrors = useCallback(() => {
    setGeneralError('');
    setOtpError(false);
  }, []);

  // Detect identifier type
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const isPhone = /^[0-9]{10}$/.test(identifier.trim().replace(/\s/g, ''));

  // Password validation
  const passwordLongEnough = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordStrength = [passwordLongEnough, hasUppercase, hasNumber].filter(Boolean).length;

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!identifier.trim()) {
      toast({ title: 'Required', description: 'Please enter your email or phone number.', variant: 'destructive' });
      return;
    }

    if (!isEmail && !isPhone) {
      toast({ title: 'Invalid Input', description: 'Please enter a valid email or 10-digit phone number.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password?action=request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setMaskedId(data.masked || identifier);
        setStep('verify-otp');
        setResendCooldown(60);
        setAttempts(0);
        toast({
          title: 'OTP Sent!',
          description: `Verification code has been sent to ${data.masked || identifier}.`,
        });

        // Show OTP in a helpful toast for demo/testing
        if (data.otp) {
          toast({
            title: 'Demo OTP',
            description: `Your verification code is: ${data.otp} (shown for demo only)`,
            duration: 8000,
          });
        }
      } else {
        toast({
          title: 'Request Failed',
          description: data.error || 'Could not send verification code.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Connection Error',
        description: 'Unable to connect. Please check your internet and try again.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password?action=request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setResendCooldown(60);
        setOtp('');
        setOtpError(false);
        setAttempts(0);
        toast({ title: 'OTP Resent!', description: 'A new verification code has been sent.' });

        if (data.otp) {
          toast({
            title: 'Demo OTP',
            description: `Your new verification code is: ${data.otp} (shown for demo only)`,
            duration: 8000,
          });
        }
      } else {
        toast({ title: 'Failed', description: data.error || 'Could not resend OTP.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (otp.length !== 6) {
      setOtpError(true);
      toast({ title: 'Incomplete Code', description: 'Please enter all 6 digits of the verification code.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password?action=verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otp }),
      });
      const data = await res.json();

      if (data.success) {
        setResetToken(data.resetToken);
        setStep('set-password');
        toast({ title: 'Verified!', description: 'Your identity has been verified. Set a new password.' });
      } else {
        setAttempts((prev) => prev + 1);
        setOtpError(true);
        toast({
          title: 'Invalid Code',
          description: data.error || 'The verification code is incorrect.',
          variant: 'destructive',
        });

        if (attempts >= 2) {
          toast({
            title: 'Too Many Attempts',
            description: 'Please request a new verification code.',
            variant: 'destructive',
            duration: 5000,
          });
          setStep('enter-identifier');
          setOtp('');
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Could not verify code. Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (newPassword.length < 6) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password?action=reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('success');
        toast({ title: 'Password Reset!', description: 'Your password has been changed successfully.' });
      } else {
        toast({
          title: 'Reset Failed',
          description: data.error || 'Could not reset password. Please start over.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not reset password. Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left branding panel - hidden on mobile */}
          <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl p-10 text-white min-h-[520px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 text-center max-w-sm">
              <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl">
                <img src="/logo.png" alt="SmartBasket" className="h-14 w-14 rounded-xl" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Account Recovery</h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed mb-8">
                Securely reset your password and get back to shopping in minutes.
              </p>

              {step === 'enter-identifier' && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                      <ShieldCheck className="size-4 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Secure Reset</p>
                      <p className="text-xs text-emerald-200/70">OTP-verified password reset</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                      <Smartphone className="size-4 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Email or Phone</p>
                      <p className="text-xs text-emerald-200/70">Verify via email or mobile number</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                      <Clock className="size-4 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Quick Process</p>
                      <p className="text-xs text-emerald-200/70">Reset in under 2 minutes</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 'verify-otp' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="size-8 text-emerald-200" />
                  </div>
                  <p className="text-sm text-emerald-100/80">
                    Enter the 6-digit code sent to your registered email or phone.
                  </p>
                </div>
              )}

              {step === 'set-password' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="size-8 text-emerald-200" />
                  </div>
                  <p className="text-sm text-emerald-100/80">
                    Create a strong password with at least 6 characters.
                  </p>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="size-8 text-emerald-200" />
                  </div>
                  <p className="text-sm text-emerald-100/80">
                    Your password has been successfully reset. You can now sign in.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right form panel */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile branding - visible only on small screens */}
            <div className="text-center mb-8 lg:hidden">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/25 border border-green-400/20">
                <ShoppingCart className="size-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
              <p className="text-sm text-gray-500 mt-1">Recover your <span className="text-red-700">Smart</span><span className="text-amber-600">Basket</span> account</p>
            </div>

            {/* Desktop title */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
              <p className="text-sm text-gray-500 mt-1">Follow the steps to recover your account</p>
            </div>

            {/* Progress steps indicator */}
            <div className="flex items-center gap-2 mb-6">
              {(['enter-identifier', 'verify-otp', 'set-password'] as Step[]).map((s, i) => {
                const stepNames = ['Verify', 'OTP', 'Password'];
                const isCompleted = ['enter-identifier', 'verify-otp', 'set-password'].indexOf(step) > i;
                const isCurrent = step === s;
                return (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="size-3.5" /> : i + 1}
                      </div>
                      <span
                        className={`text-[11px] font-medium hidden sm:block transition-colors ${
                          isCurrent ? 'text-green-700' : isCompleted ? 'text-green-500' : 'text-gray-400'
                        }`}
                      >
                        {stepNames[i]}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className={`flex-1 h-[2px] rounded-full transition-colors duration-300 ${
                          ['enter-identifier', 'verify-otp', 'set-password'].indexOf(step) > i
                            ? 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <Card className="border-gray-200/80 shadow-sm py-5">
              <CardContent>
                {/* Step 1: Enter Identifier */}
                {step === 'enter-identifier' && (
                  <>
                    <div className="text-center mb-5 lg:hidden">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="size-6 text-green-600" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">Find Your Account</h3>
                      <p className="text-xs text-gray-500 mt-1">Enter your email or phone number</p>
                    </div>

                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          Email Address or Phone Number
                        </label>
                        <div className="relative group">
                          {identifier && isEmail ? (
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                          ) : identifier && isPhone ? (
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                          ) : (
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                          )}
                          <Input
                            type="text"
                            value={identifier}
                            onChange={(e) => {
                              setIdentifier(e.target.value);
                              clearErrors();
                            }}
                            placeholder="you@example.com or 9876543210"
                            className="pl-10 h-11 border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300 transition-all"
                            autoFocus
                          />
                        </div>
                        {identifier.length > 0 && !isEmail && !isPhone && (
                          <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                            <AlertTriangle className="size-3" />
                            Enter a valid email or 10-digit phone number
                          </p>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3 flex items-start gap-2.5">
                        <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-600 leading-relaxed">
                          We will send a 6-digit verification code to your registered email or phone number to verify your identity.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !identifier.trim() || (!isEmail && !isPhone)}
                        className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl text-base font-semibold shadow-lg shadow-green-600/20 transition-all"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <>
                            Send Verification Code
                            <ArrowLeft className="size-4 rotate-180" />
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}

                {/* Step 2: Verify OTP */}
                {step === 'verify-otp' && (
                  <>
                    <div className="text-center mb-5 lg:hidden">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="size-6 text-green-600" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">Verify Your Identity</h3>
                      <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code</p>
                    </div>

                    <div className="mb-5">
                      <p className="text-sm text-gray-600 text-center">
                        We sent a verification code to
                      </p>
                      <p className="text-sm font-semibold text-gray-800 text-center mt-1">
                        {isEmail ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Mail className="size-3.5 text-green-500" />
                            {maskedId}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <Phone className="size-3.5 text-green-500" />
                            {maskedId}
                          </span>
                        )}
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="flex flex-col items-center gap-2">
                        <OtpInput
                          length={6}
                          value={otp}
                          onChange={(val) => {
                            setOtp(val);
                            setOtpError(false);
                          }}
                          disabled={loading}
                          error={otpError}
                        />
                        {otpError && (
                          <p className="text-xs text-red-500 flex items-center gap-1 animate-in fade-in duration-200">
                            <XCircle className="size-3" />
                            Invalid code. Please try again.
                          </p>
                        )}
                      </div>

                      <div className="text-center">
                        {resendCooldown > 0 ? (
                          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                            <Clock className="size-3" />
                            Resend code in <span className="font-mono font-semibold text-gray-600">{resendCooldown}s</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={loading}
                            className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
                            Resend verification code
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setStep('enter-identifier');
                            setOtp('');
                            setOtpError(false);
                          }}
                          disabled={loading}
                          className="h-11 rounded-xl border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <ArrowLeft className="size-4 mr-1.5" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading || otp.length !== 6}
                          className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl text-base font-semibold shadow-lg shadow-green-600/20 transition-all"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="size-4 animate-spin" />
                              Verifying...
                            </span>
                          ) : (
                            <>
                              Verify Code
                              <ArrowLeft className="size-4 rotate-180" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}

                {/* Step 3: Set New Password */}
                {step === 'set-password' && (
                  <>
                    <div className="text-center mb-5 lg:hidden">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Lock className="size-6 text-green-600" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">Set New Password</h3>
                      <p className="text-xs text-gray-500 mt-1">Create a strong password</p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          New Password
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              clearErrors();
                            }}
                            placeholder="Min. 6 characters"
                            className={`pl-10 pr-10 h-11 transition-all ${
                              newPassword.length > 0 && !passwordLongEnough
                                ? 'border-red-300 focus-visible:ring-red-100'
                                : passwordLongEnough
                                ? 'border-green-300 focus-visible:ring-green-100 focus-visible:border-green-300'
                                : 'border-gray-200 focus-visible:ring-green-100 focus-visible:border-green-300'
                            }`}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                          >
                            {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                        {/* Password strength */}
                        {newPassword.length > 0 && (
                          <div className="mt-2">
                            <div className="flex gap-1">
                              <div className={`h-1 flex-1 rounded-full transition-colors ${passwordLongEnough ? 'bg-green-400' : 'bg-gray-200'}`} />
                              <div className={`h-1 flex-1 rounded-full transition-colors ${hasUppercase ? 'bg-green-400' : 'bg-gray-200'}`} />
                              <div className={`h-1 flex-1 rounded-full transition-colors ${hasNumber ? 'bg-green-400' : 'bg-gray-200'}`} />
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                              <p className={`text-[11px] ${passwordLongEnough ? 'text-green-600' : 'text-gray-400'}`}>
                                {passwordLongEnough ? '✓' : '○'} 6+ chars
                              </p>
                              <p className={`text-[11px] ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                {hasUppercase ? '✓' : '○'} Uppercase
                              </p>
                              <p className={`text-[11px] ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                {hasNumber ? '✓' : '○'} Number
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              clearErrors();
                            }}
                            placeholder="Re-enter new password"
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

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setStep('verify-otp');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          disabled={loading}
                          className="h-11 rounded-xl border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <ArrowLeft className="size-4 mr-1.5" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            loading ||
                            !newPassword ||
                            !confirmPassword ||
                            !passwordLongEnough ||
                            !passwordsMatch
                          }
                          className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl text-base font-semibold shadow-lg shadow-green-600/20 transition-all"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="size-4 animate-spin" />
                              Resetting...
                            </span>
                          ) : (
                            <>
                              Reset Password
                              <CheckCircle2 className="size-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}

                {/* Step 4: Success */}
                {step === 'success' && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                      <CheckCircle2 className="size-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Password Reset Successful!</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
                      Your password has been changed successfully. You can now sign in with your new password.
                    </p>
                    <Button
                      onClick={() => navigate('login')}
                      className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl text-base font-semibold shadow-lg shadow-green-600/20 transition-all"
                    >
                      Sign In Now
                      <ArrowLeft className="size-4 rotate-180 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Back to login */}
            {step !== 'success' && (
              <div className="mt-5 text-center">
                <button
                  onClick={() => navigate('login')}
                  className="text-sm text-gray-500 hover:text-green-600 font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
