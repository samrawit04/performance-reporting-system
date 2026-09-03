'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing password reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      const res = await api.post<{ message: string }>('/auth/reset-password', {
        token,
        password,
      });
      setStatus('success');
      setMessage(res.message || 'Password has been reset successfully!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to reset password. Link may have expired.');
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium text-left">
          Missing password reset token. Please use the reset link sent to your email.
        </div>
        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-[var(--primary)] hover:underline block"
        >
          Request a new reset link &rarr;
        </Link>
      </div>
    );
  }

  return (
    <>
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium text-left ${
            status === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          {message}
        </div>
      )}

      {status !== 'success' ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === 'loading'}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors p-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
          />

          <Input
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={status === 'loading'}
            required
          />

          <Button
            type="submit"
            className="w-full py-3"
            isLoading={status === 'loading'}
            size="lg"
          >
            Update Password &rarr;
          </Button>
        </form>
      ) : (
        <div className="pt-2">
          <Link href="/login">
            <Button size="lg" className="w-full">
              Proceed to Sign In &rarr;
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-sky-50/40 dark:from-slate-950 dark:to-slate-900 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-[var(--card)] rounded-3xl p-8 md:p-10 shadow-2xl border border-[var(--border)] text-center space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-inner overflow-hidden">
            <Image
              src="/logo.jpg"
              alt="Performance RS Logo"
              width={56}
              height={56}
              className="w-full h-full object-cover rounded-2xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            Reset Your Password
          </h1>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Choose a new secure password for your Performance System account.
          </p>
        </div>

        <Suspense fallback={<div className="text-xs text-[var(--muted)] py-4">Verifying reset token...</div>}>
          <ResetPasswordContent />
        </Suspense>

        <div className="pt-2 border-t border-[var(--border)]">
          <Link
            href="/login"
            className="text-xs font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
