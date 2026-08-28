'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold uppercase tracking-wider">
            <span>Role:</span>
            <span>{user?.role}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome back, {user?.first_name} {user?.last_name}!
          </h1>
          <p className="text-indigo-100 max-w-xl text-sm leading-relaxed">
            Executive Performance Management System — submit performance data via
            manual entry or Excel upload, evaluate across the 4 Balanced Scorecard
            perspectives, generate AI analysis, and produce executive reports.
          </p>
        </div>
      </div>

      {/* Quick Action Cards based on Role */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Submission Card (Manager/Admin) */}
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 text-2xl flex items-center justify-center">
                📝
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  Submit Performance
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Enter monthly or quarterly KPI figures manually for review.
                </p>
              </div>
              <Link href="/performance" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Go to Submissions
                </Button>
              </Link>
            </div>
          )}

          {/* Excel Upload Card (Manager/Admin) */}
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 text-2xl flex items-center justify-center">
                📥
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  Upload Excel Report
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Upload the 7-column performance Excel template for auto-extraction.
                </p>
              </div>
              <Link href="/performance/upload" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Upload Spreadsheet
                </Button>
              </Link>
            </div>
          )}

          {/* Review Queue (Reviewer/Admin) */}
          {(user?.role === 'REVIEWER' || user?.role === 'ADMIN') && (
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 text-2xl flex items-center justify-center">
                ⚖️
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  CEO Review Queue
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Review calculated scores, examine AI analysis, provide advice & approve.
                </p>
              </div>
              <Link href="/review" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Open Review Queue
                </Button>
              </Link>
            </div>
          )}

          {/* User Management (Admin only) */}
          {user?.role === 'ADMIN' && (
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 text-2xl flex items-center justify-center">
                👥
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  User Management
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Add team members, assign Manager/Reviewer roles, and toggle accounts.
                </p>
              </div>
              <Link href="/users" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Users
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* BSC Framework Summary */}
      <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] space-y-4">
        <h2 className="text-base font-bold text-[var(--foreground)]">
          Balanced Scorecard (BSC) Perspectives
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-1">
            <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
              1. Financial
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              Cost control, revenue targets, waste reduction & budget variance.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 space-y-1">
            <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
              2. Customer
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              Client satisfaction, retention, service delivery quality & NPS.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
              3. Internal Process
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              Turnaround time, error rates, compliance & process efficiency.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-1">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              4. Learning & Growth
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              Team capabilities, training hours, retention & leadership dev.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
