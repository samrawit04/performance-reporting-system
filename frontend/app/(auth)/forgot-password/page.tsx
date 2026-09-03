'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage(null);

    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
      setStatus('success');
      setMessage(res.message || 'If an account exists with this email, a reset link has been sent.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to request password reset. Please try again.');
    }
  };

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
            Forgot Password
          </h1>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Enter your account email address and we will send you a secure link to reset your password.
          </p>
        </div>

        {/* Feedback message */}
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
              label="Email Address"
              type="email"
              placeholder="e.g. admin@performance.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              required
            />

            <Button
              type="submit"
              className="w-full py-3"
              isLoading={status === 'loading'}
              size="lg"
            >
              Send Reset Link &rarr;
            </Button>
          </form>
        ) : null}

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
