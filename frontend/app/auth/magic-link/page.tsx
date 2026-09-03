'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api';
import { User } from '../../../lib/types';
import Link from 'next/link';
import { Button } from '../../../components/ui/Button';

function MagicLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) {
      setError('No verification token was provided in the link.');
      setStatus('error');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get<{
          access_token: string;
          user: User;
          submissionId?: string;
        }>(`/auth/magic-link?token=${token}`);

        setSession(res.access_token, res.user);
        setStatus('success');

        // Route to the submission or appropriate page
        setTimeout(() => {
          if (res.submissionId) {
            if (res.user.role === 'REVIEWER' || res.user.role === 'ADMIN') {
              router.replace(`/review/${res.submissionId}`);
            } else {
              router.replace(`/performance/${res.submissionId}`);
            }
          } else {
            router.replace('/dashboard');
          }
        }, 1200);
      } catch (err: any) {
        setError(
          err.message ||
            'This secure review link has expired or is invalid. Please sign in with your credentials.',
        );
        setStatus('error');
      }
    };

    verifyToken();
  }, [token, router, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-sky-50/40 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md bg-[var(--card)] rounded-3xl p-8 md:p-10 shadow-2xl border border-[var(--border)] text-center space-y-6">
        <div className="w-14 h-14 bg-[var(--primary-light)] text-2xl rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          {status === 'verifying' ? '' : status === 'success' ? '' : ''}
        </div>

        {status === 'verifying' && (
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
              Verifying Secure Access Link
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Authenticating session and preparing your performance report...
            </p>
            <div className="pt-4">
              <div className="w-8 h-8 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-2 animate-fade-in">
            <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              Authentication Verified!
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Redirecting you to the report workspace now...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-xl font-bold text-red-600 dark:text-red-400 tracking-tight">
              Link Expired or Invalid
            </h1>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {error}
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button className="w-full">Sign In with Credentials &rarr;</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
        </div>
      }
    >
      <MagicLinkHandler />
    </Suspense>
  );
}
