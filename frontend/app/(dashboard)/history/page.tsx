'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { PerformanceSubmission, SubmissionStatus, PeriodType } from '../../../lib/types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/auth-context';

export default function PerformanceHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<PerformanceSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | PeriodType>('ALL');

  useEffect(() => {
    if (user && user.role !== 'MANAGER') {
      router.replace('/dashboard');
      return;
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<PerformanceSubmission[]>('/submissions');
        setSubmissions(data);
      } catch (err) {
        console.error('Failed to load performance history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user, router]);

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral">Draft</Badge>;
      case 'SUBMITTED':
        return <Badge variant="info">Submitted</Badge>;
      case 'CALCULATED':
        return <Badge variant="primary">Calculated</Badge>;
      case 'AI_ANALYZED':
        return <Badge variant="primary">AI Analyzed</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'FINALIZED':
        return <Badge variant="success">Finalized</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRatingBadge = (rating?: string) => {
    if (!rating) return null;
    switch (rating.toLowerCase()) {
      case 'excellent':
        return <Badge variant="success">Excellent</Badge>;
      case 'good':
        return <Badge variant="info">Good</Badge>;
      case 'satisfactory':
        return <Badge variant="warning">Satisfactory</Badge>;
      default:
        return <Badge variant="danger">{rating}</Badge>;
    }
  };

  const scoredSubmissions = submissions.filter(
    (s) => s.overall_score !== null && s.overall_score !== undefined,
  );

  const avgScore = scoredSubmissions.length
    ? Number(
        (
          scoredSubmissions.reduce((sum, s) => sum + Number(s.overall_score), 0) /
          scoredSubmissions.length
        ).toFixed(2),
      )
    : 0;

  const highestScore = scoredSubmissions.length
    ? Math.max(...scoredSubmissions.map((s) => Number(s.overall_score)))
    : 0;

  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;

  const filteredSubmissions = submissions.filter((s) => {
    if (periodFilter === 'ALL') return true;
    return s.period_type === periodFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Performance History &amp; Score Progression
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Track your historical Balanced Scorecard achievements, score evolutions, and CEO sign-offs across cycles.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/performance/new">
            <Button size="sm">+ New Entry</Button>
          </Link>
          <Link href="/performance/upload">
            <Button variant="outline" size="sm">📥 Upload Excel</Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Total Submissions
          </div>
          <div className="text-2xl font-black text-[var(--foreground)] mt-2">
            {submissions.length}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            {approvedCount} officially approved
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Career Average Score
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-2">
            {avgScore ? `${avgScore}%` : '—'}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            Across evaluated cycles
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Peak Performance Score
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {highestScore ? `${highestScore}%` : '—'}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            Personal best record
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Latest Rating
          </div>
          <div className="text-2xl font-black text-[var(--foreground)] mt-2">
            {scoredSubmissions[0]?.overall_rating || 'Pending'}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            {scoredSubmissions[0]?.period_label || 'Current period'}
          </div>
        </div>
      </div>

      {/* Cadence Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div className="text-sm font-bold text-[var(--foreground)]">
          Evaluation History Timeline
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          {(['ALL', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'WEEKLY'] as const).map((cadence) => (
            <button
              key={cadence}
              onClick={() => setPeriodFilter(cadence)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                periodFilter === cadence
                  ? 'bg-[var(--card)] text-[var(--primary)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {cadence === 'ALL' ? 'All Cadences' : cadence}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[var(--muted)]">Loading historical performance data...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--card)] border border-[var(--border)] text-center space-y-3">
          <div className="text-3xl">📜</div>
          <div className="font-bold text-sm text-[var(--foreground)]">
            No history records found for this filter
          </div>
          <p className="text-xs text-[var(--muted)]">
            Create or upload performance submissions to build your historical evaluation record.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub, idx) => {
            const hasScore = sub.overall_score !== null && sub.overall_score !== undefined;
            return (
              <div
                key={sub.id}
                className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:border-[var(--primary)]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(sub.status)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      {sub.period_type} EVALUATION
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-[var(--muted)]">
                      Submitted on {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                    {sub.period_label}
                  </h3>

                  {/* 4 BSC mini indicators */}
                  {sub.perspective_scores && sub.perspective_scores.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sub.perspective_scores.map((p) => (
                        <div
                          key={p.id || p.perspective}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-[var(--border)] text-[11px] font-semibold text-[var(--muted)] flex items-center gap-1.5"
                        >
                          <span className="uppercase text-[9px] font-bold text-[var(--primary)]">
                            {p.perspective.slice(0, 3)}:
                          </span>
                          <span className="text-[var(--foreground)]">{p.average_score}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score & Actions Box */}
                <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-6">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Score
                    </div>
                    <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                      {hasScore ? `${sub.overall_score}%` : '—'}
                    </div>
                    <div className="mt-0.5">{getRatingBadge(sub.overall_rating)}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href={`/performance/${sub.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        View Details &rarr;
                      </Button>
                    </Link>
                    {sub.status === 'APPROVED' && (
                      <Link href={`/reports`}>
                        <Button size="sm" variant="secondary" className="w-full text-xs">
                          📄 Download PDF
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
