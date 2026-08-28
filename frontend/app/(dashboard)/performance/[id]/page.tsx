'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import {
  PerformanceSubmission,
  BscPerspective,
  SubmissionStatus,
} from '../../../../lib/types';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [submission, setSubmission] = useState<PerformanceSubmission | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<PerformanceSubmission>(`/submissions/${id}`);
      setSubmission(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load submission details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await api.post(`/submissions/${id}/calculate`);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to recalculate submission');
    } finally {
      setIsRecalculating(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-[var(--muted)]">Loading submission evaluation...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center space-y-4">
        <div className="text-3xl">⚠️</div>
        <div className="font-bold text-base text-[var(--foreground)]">
          {error || 'Submission Not Found'}
        </div>
        <Link href="/performance">
          <Button variant="outline" size="sm">
            ← Back to Submissions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/performance"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
          >
            ← Submissions
          </Link>
          <span className="text-xs text-slate-300">/</span>
          <span className="text-xs font-bold text-[var(--foreground)]">
            {submission.period_label}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            isLoading={isRecalculating}
          >
            🔄 Recalculate Scores
          </Button>
        </div>
      </div>

      {/* Executive Summary Highlight Card */}
      <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            {getStatusBadge(submission.status)}
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
              {submission.period_type} EVALUATION
            </span>
          </div>

          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            {submission.period_label}
          </h1>

          <div className="text-xs text-[var(--muted)] flex items-center gap-4 pt-1">
            <div>
              Executive:{' '}
              <strong className="text-[var(--foreground)]">
                {submission.executive
                  ? `${submission.executive.first_name} ${submission.executive.last_name}`
                  : '—'}
              </strong>
            </div>
            <div>•</div>
            <div>
              Submitted on:{' '}
              <span className="text-[var(--foreground)]">
                {new Date(submission.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Score Badge */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/60 text-center min-w-44 shrink-0 shadow-inner">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Overall Score
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {submission.overall_score !== null &&
            submission.overall_score !== undefined
              ? `${submission.overall_score}%`
              : '—'}
          </div>
          <div className="mt-2 flex justify-center">
            {getRatingBadge(submission.overall_rating)}
          </div>
        </div>
      </div>

      {/* 4 Balanced Scorecard Perspective Summary Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
          Balanced Scorecard Perspectives Performance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              key: 'FINANCIAL',
              name: '1. Financial',
              theme: 'purple',
            },
            {
              key: 'CUSTOMER',
              name: '2. Customer',
              theme: 'cyan',
            },
            {
              key: 'INTERNAL_PROCESS',
              name: '3. Internal Process',
              theme: 'amber',
            },
            {
              key: 'LEARNING_GROWTH',
              name: '4. Learning & Growth',
              theme: 'emerald',
            },
          ].map((item) => {
            const bsc = submission.perspective_scores?.find(
              (p) => p.perspective === item.key,
            );

            return (
              <div
                key={item.key}
                className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-2"
              >
                <div className="text-xs font-bold text-[var(--foreground)]">
                  {item.name}
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div className="text-2xl font-black text-[var(--foreground)]">
                    {bsc ? `${bsc.average_score}%` : '—'}
                  </div>
                  {bsc && getRatingBadge(bsc.rating)}
                </div>

                <div className="text-[10px] text-[var(--muted)]">
                  {submission.entries?.filter(
                    (e) => e.perspective === item.key,
                  ).length || 0}{' '}
                  KPI metric(s)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Detail Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
          KPI Performance Breakdown (Calculated Results)
        </h2>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] uppercase font-bold text-[var(--muted)] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Perspective</th>
                  <th className="px-4 py-3.5">Strategic Objective</th>
                  <th className="px-4 py-3.5">Measurement</th>
                  <th className="px-4 py-3.5">Unit</th>
                  <th className="px-4 py-3.5 text-right">Plan</th>
                  <th className="px-4 py-3.5 text-right">Actual</th>
                  <th className="px-4 py-3.5 text-right">Achv %</th>
                  <th className="px-4 py-3.5 text-right">Score</th>
                  <th className="px-4 py-3.5 text-center">Rating</th>
                  <th className="px-4 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {submission.entries?.map((e, idx) => (
                  <tr
                    key={e.id || idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                      <Badge variant="primary" size="sm">
                        {e.perspective}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                      {e.objective}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {e.measurement}
                    </td>
                    <td className="px-4 py-3 font-mono">{e.unit}</td>
                    <td className="px-4 py-3 font-mono text-right font-medium">
                      {e.plan_value}
                    </td>
                    <td className="px-4 py-3 font-mono text-right font-medium">
                      {e.actual_value}
                    </td>
                    <td className="px-4 py-3 font-mono text-right font-bold text-[var(--primary)]">
                      {e.achievement_pct !== undefined ? `${e.achievement_pct}%` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-right font-bold">
                      {e.score !== undefined ? `${e.score}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getRatingBadge(e.rating)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)] max-w-xs truncate">
                      {e.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
