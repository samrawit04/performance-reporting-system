'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { PerformanceSubmission, SubmissionStatus } from '../../../lib/types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function ReviewQueuePage() {
  const [submissions, setSubmissions] = useState<PerformanceSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<PerformanceSubmission[]>('/reviews/queue');
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

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

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'APPROVED') return sub.status === 'APPROVED';
    if (filter === 'PENDING')
      return sub.status === 'CALCULATED' || sub.status === 'AI_ANALYZED' || sub.status === 'UNDER_REVIEW';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Executive Review Workspace
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Review performance submissions, assess BSC results, provide CEO feedback, and grant official approvals.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 shadow-2xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filter === 'PENDING'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Awaiting Review (
            {
              submissions.filter(
                (s) =>
                  s.status === 'CALCULATED' ||
                  s.status === 'AI_ANALYZED' ||
                  s.status === 'UNDER_REVIEW',
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filter === 'APPROVED'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Approved ({submissions.filter((s) => s.status === 'APPROVED').length})
          </button>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] text-xs uppercase font-bold text-[var(--muted)] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Reporting Period</th>
                <th className="px-6 py-3.5">Executive</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Overall Score</th>
                <th className="px-6 py-3.5">Rating</th>
                <th className="px-6 py-3.5">Submitted</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted)]">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading review queue...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted)]">
                    <div className="space-y-3">
                      <div className="text-3xl">🎉</div>
                      <div className="font-semibold text-sm text-[var(--foreground)]">
                        No submissions currently awaiting review
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        Submissions will appear here when managers calculate and submit performance reports.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-[var(--foreground)]">
                      <Link
                        href={`/review/${sub.id}`}
                        className="hover:text-[var(--primary)] hover:underline"
                      >
                        {sub.period_label}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {sub.executive
                        ? `${sub.executive.first_name} ${sub.executive.last_name}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-sm">
                      {sub.overall_score !== null && sub.overall_score !== undefined
                        ? `${sub.overall_score}%`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {sub.overall_rating ? (
                        getRatingBadge(sub.overall_rating)
                      ) : (
                        <span className="text-xs text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--muted)]">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/review/${sub.id}`}>
                        <Button size="sm">
                          {sub.status === 'APPROVED'
                            ? 'View Review →'
                            : 'Review & Sign Off →'}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
