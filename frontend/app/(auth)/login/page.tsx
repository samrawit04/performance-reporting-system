'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/auth-context';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md bg-[var(--card)] rounded-3xl p-8 md:p-10 shadow-2xl border border-[var(--border)] text-center space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 bg-[var(--primary-light)] text-2xl rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            📊
          </div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Performance RS
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Executive Balanced Scorecard Performance System
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium text-left">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. admin@performance.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          <Button
            type="submit"
            className="w-full py-3"
            isLoading={isLoading}
            size="lg"
          >
            Sign In to System
          </Button>
        </form>

        {/* Demo Quick-Fill Presets */}
        <div className="pt-4 border-t border-[var(--border)] text-left space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] text-center">
            Demo Credentials (1-Click Fill)
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@performance.com', 'admin123')}
              className="p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all text-left text-xs cursor-pointer group"
            >
              <div className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                Admin
              </div>
              <div className="text-[10px] text-[var(--muted)]">admin123</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('dawit@performance.com', 'manager123')}
              className="p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all text-left text-xs cursor-pointer group"
            >
              <div className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                Manager
              </div>
              <div className="text-[10px] text-[var(--muted)]">manager123</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('ceo@performance.com', 'reviewer123')}
              className="p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all text-left text-xs cursor-pointer group"
            >
              <div className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                CEO Reviewer
              </div>
              <div className="text-[10px] text-[var(--muted)]">reviewer123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
