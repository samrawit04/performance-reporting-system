'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, type HealthResponse } from '../lib/api';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/Button';

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<HealthResponse>('/health');
      setHealth(data);
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to backend',
      );
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-xl w-full bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--border)] p-8 md:p-10 text-center space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-3xl flex items-center justify-center mx-auto shadow-inner">
            📊
          </div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Performance Reporting System
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Executive Performance Management • Balanced Scorecard Framework
          </p>
        </div>

        {/* Auth CTA Banner */}
        <div className="p-6 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                Signed in as {user?.first_name} {user?.last_name} ({user?.role})
              </div>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard">
                  <Button size="md">Go to Dashboard →</Button>
                </Link>
                <Button variant="outline" size="md" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                Ready to evaluate performance?
              </div>
              <div className="flex justify-center">
                <Link href="/login">
                  <Button size="lg" className="px-8 shadow-md">
                    Sign In to Portal →
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Health check section */}
        <div className="pt-2 border-t border-[var(--border)] space-y-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Backend & Neon PostgreSQL Status
            </span>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Run Diagnostics'}
            </button>
          </div>

          {health && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1.5 animate-fade-in">
              <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <span>✅</span> All Systems Operational
              </div>
              <div>
                <strong>Database:</strong> {health.database.status} (
                {health.database.provider})
              </div>
              <div>
                <strong>Query Latency:</strong> {health.database.latencyMs}ms
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-xs space-y-1 animate-fade-in">
              <div className="font-bold text-red-700 dark:text-red-300">
                ❌ Diagnostic Failed
              </div>
              <div>{error}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
