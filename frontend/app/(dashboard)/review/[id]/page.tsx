'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import {
  PerformanceSubmission,
  AiAnalysis,
  ReviewFeedback,
  ReviewAction,
} from '../../../../lib/types';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

export default function ReviewWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [submission, setSubmission] = useState<PerformanceSubmission | null>(
    null,
  );
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [existingReview, setExistingReview] = useState<ReviewFeedback | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [action, setAction] = useState<ReviewAction>('APPROVED');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [financialFeedback, setFinancialFeedback] = useState('');
  const [customerFeedback, setCustomerFeedback] = useState('');
  const [internalFeedback, setInternalFeedback] = useState('');
  const [learningFeedback, setLearningFeedback] = useState('');
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<PerformanceSubmission>(`/submissions/${id}`);
      setSubmission(data);

      // Fetch AI Analysis if present
      try {
        const aiData = await api.get<AiAnalysis>(
          `/submissions/${id}/ai-analysis`,
        );
        if (aiData && aiData.id) {
          setAiAnalysis(aiData);
        }
      } catch {}

      // Fetch Existing Review if present
      try {
        const reviewData = await api.get<ReviewFeedback>(
          `/submissions/${id}/review`,
        );
        if (reviewData && reviewData.id) {
          setExistingReview(reviewData);
          setAction(reviewData.action);
          setOverallFeedback(reviewData.overall_feedback);
          setFinancialFeedback(
            reviewData.perspective_feedback?.FINANCIAL || '',
          );
          setCustomerFeedback(reviewData.perspective_feedback?.CUSTOMER || '');
          setInternalFeedback(
            reviewData.perspective_feedback?.INTERNAL_PROCESS || '',
          );
          setLearningFeedback(
            reviewData.perspective_feedback?.LEARNING_GROWTH || '',
          );
          setFocusAreas(reviewData.recommended_focus_areas || []);
        }
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Failed to load submission details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddFocusArea = () => {
    if (!focusAreaInput.trim()) return;
    setFocusAreas([...focusAreas, focusAreaInput.trim()]);
    setFocusAreaInput('');
  };

  const handleRemoveFocusArea = (idx: number) => {
    setFocusAreas(focusAreas.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overallFeedback.trim()) {
      alert('Please provide overall feedback comments before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/submissions/${id}/review`, {
        action,
        overall_feedback: overallFeedback.trim(),
        perspective_feedback: {
          FINANCIAL: financialFeedback.trim() || undefined,
          CUSTOMER: customerFeedback.trim() || undefined,
          INTERNAL_PROCESS: internalFeedback.trim() || undefined,
          LEARNING_GROWTH: learningFeedback.trim() || undefined,
        },
        recommended_focus_areas: focusAreas,
      });

      alert(
        action === 'APPROVED'
          ? 'Performance Report successfully approved!'
          : 'Report returned to submitter for revision.',
      );
      router.push('/review');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-[var(--muted)]">Loading review workspace...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="w-full py-20 text-center space-y-4">
        <div className="text-3xl"></div>
        <div className="font-bold text-base text-[var(--foreground)]">
          {error || 'Submission Not Found'}
        </div>
        <Link href="/review">
          <Button variant="outline" size="sm">
            ← Back to Review Queue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in pb-16">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/review"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
          >
            ← Review Queue
          </Link>
          <span className="text-xs text-slate-300">/</span>
          <span className="text-xs font-bold text-[var(--foreground)]">
            Review Workspace: {submission.period_label}
          </span>
        </div>

        <Link href={`/performance/${submission.id}`}>
          <Button variant="outline" size="sm">
             View Public Report
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Badge variant={submission.status === 'APPROVED' ? 'success' : 'warning'}>
              {submission.status}
            </Badge>
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
              {submission.period_type} EVALUATION
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
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

        {/* Score Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/40 border border-sky-100 dark:border-sky-900/60 text-center min-w-44 shrink-0 shadow-inner">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Overall Score
          </div>
          <div className="text-3xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            {submission.overall_score !== null &&
            submission.overall_score !== undefined
              ? `${submission.overall_score}%`
              : '—'}
          </div>
          <div className="mt-2 text-xs font-bold text-sky-700 dark:text-sky-300">
            {submission.overall_rating || 'Unrated'}
          </div>
        </div>
      </div>

      {/* 4 BSC Perspectives Summary */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
          Balanced Scorecard Perspectives Performance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'FINANCIAL', name: '1. Financial' },
            { key: 'CUSTOMER', name: '2. Customer' },
            { key: 'INTERNAL_PROCESS', name: '3. Internal Process' },
            { key: 'LEARNING_GROWTH', name: '4. Learning & Growth' },
          ].map((item) => {
            const bsc = submission.perspective_scores?.find(
              (p) => p.perspective === item.key,
            );

            return (
              <div
                key={item.key}
                className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-1.5"
              >
                <div className="text-xs font-bold text-[var(--foreground)]">
                  {item.name}
                </div>
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {bsc ? `${bsc.average_score}%` : '—'}
                </div>
                <div className="text-[11px] font-semibold text-[var(--primary)]">
                  {bsc ? bsc.rating : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Analysis Summary Preview if present */}
      {aiAnalysis && (
        <div className="p-6 rounded-3xl bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-900/50 space-y-3">
          <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-xs uppercase tracking-wider">
            <span>🤖</span> AI Executive Summary Reference
          </div>
          <p className="text-xs text-[var(--foreground)] leading-relaxed">
            {aiAnalysis.executive_summary}
          </p>
        </div>
      )}

      {/* CEO Review & Decision Form */}
      <form
        onSubmit={handleSubmitReview}
        className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-6"
      >
        <div className="border-b border-[var(--border)] pb-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            Executive Decision & Guidance
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Submit your official review, strategic commentary, and per-perspective direction.
          </p>
        </div>

        {/* Action Radio Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
            Official Review Action
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                action === 'APPROVED'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                name="action"
                value="APPROVED"
                checked={action === 'APPROVED'}
                onChange={() => setAction('APPROVED')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                   Approve Performance Report
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  Sign off and approve the evaluation.
                </div>
              </div>
            </label>

            <label
              className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                action === 'RETURNED'
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                  : 'border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                name="action"
                value="RETURNED"
                checked={action === 'RETURNED'}
                onChange={() => setAction('RETURNED')}
                className="text-amber-600 focus:ring-amber-500"
              />
              <div>
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                   Return to Submitter for Revision
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  Request changes or additional context.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Overall CEO Comments */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
            Overall Executive Comments / CEO Remarks *
          </label>
          <textarea
            rows={4}
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            placeholder="Enter executive assessment, commendations, or specific instructions..."
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] leading-relaxed"
            required
          />
        </div>

        {/* Per-Perspective Specific Guidance */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Perspective-Specific Guidance (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--foreground)]">
                1. Financial Direction
              </label>
              <input
                type="text"
                value={financialFeedback}
                onChange={(e) => setFinancialFeedback(e.target.value)}
                placeholder="e.g. Continue disciplined expense management"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--foreground)]">
                2. Customer Direction
              </label>
              <input
                type="text"
                value={customerFeedback}
                onChange={(e) => setCustomerFeedback(e.target.value)}
                placeholder="e.g. Focus on reducing client escalations"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--foreground)]">
                3. Internal Process Direction
              </label>
              <input
                type="text"
                value={internalFeedback}
                onChange={(e) => setInternalFeedback(e.target.value)}
                placeholder="e.g. Standardize automated quality controls"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--foreground)]">
                4. Learning & Growth Direction
              </label>
              <input
                type="text"
                value={learningFeedback}
                onChange={(e) => setLearningFeedback(e.target.value)}
                placeholder="e.g. Expand cross-functional mentorship"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>

        {/* Recommended Focus Areas */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
            Recommended Strategic Focus Areas
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={focusAreaInput}
              onChange={(e) => setFocusAreaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFocusArea();
                }
              }}
              placeholder="Type focus area and click Add (e.g. Accelerate client onboarding)"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddFocusArea}
            >
              + Add
            </Button>
          </div>

          {focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {focusAreas.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-[var(--foreground)] border border-[var(--border)]"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFocusArea(idx)}
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
          <Link href="/review">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>

          <Button type="submit" isLoading={isSubmitting} size="lg">
            {action === 'APPROVED'
              ? ' Confirm & Approve Report'
              : ' Return Report to Submitter'}
          </Button>
        </div>
      </form>
    </div>
  );
}
