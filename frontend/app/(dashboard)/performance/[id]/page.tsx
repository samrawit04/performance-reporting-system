'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import {
  PerformanceSubmission,
  AiAnalysis,
  ReviewFeedback,
  SubmissionStatus,
} from '../../../../lib/types';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { useAuth } from '../../../../context/auth-context';

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';
  const isReviewer = user?.role === 'REVIEWER';
  const [submission, setSubmission] = useState<PerformanceSubmission | null>(
    null,
  );
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedback | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<'kpi' | 'ai' | 'review'>('kpi');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit AI modal state
  const [isEditAiOpen, setIsEditAiOpen] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [isSavingAi, setIsSavingAi] = useState(false);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<PerformanceSubmission>(`/submissions/${id}`);
      setSubmission(data);

      // Fetch AI analysis if available
      try {
        const aiData = await api.get<AiAnalysis>(
          `/submissions/${id}/ai-analysis`,
        );
        if (aiData && aiData.id) {
          setAiAnalysis(aiData);
          setEditSummary(aiData.executive_summary || '');
        }
      } catch {}

      // Fetch Review Feedback if available
      try {
        const reviewData = await api.get<ReviewFeedback>(
          `/submissions/${id}/review`,
        );
        if (reviewData && reviewData.id) {
          setReviewFeedback(reviewData);
        }
      } catch {}
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

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const generated = await api.post<AiAnalysis>(
        `/submissions/${id}/generate-ai-analysis`,
      );
      setAiAnalysis(generated);
      setEditSummary(generated.executive_summary || '');
      setActiveTab('ai');
      if (submission) {
        setSubmission({
          ...submission,
          status: 'AI_ANALYZED',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI analysis');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveEditedAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiAnalysis) return;

    setIsSavingAi(true);
    try {
      const updated = await api.patch<AiAnalysis>(
        `/submissions/${id}/ai-analysis`,
        {
          executive_summary: editSummary,
        },
      );
      setAiAnalysis(updated);
      setIsEditAiOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save edits');
    } finally {
      setIsSavingAi(false);
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
      {/* Top Breadcrumb & Action Bar */}
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
          {/* MANAGER ONLY: Recalculate */}
          {isManager && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              isLoading={isRecalculating}
            >
              🔄 Recalculate Scores
            </Button>
          )}

          {/* REVIEWER (CEO) ONLY: AI Analysis + Review Workspace */}
          {isReviewer && (
            <>
              <Button
                size="sm"
                onClick={handleGenerateAi}
                isLoading={isGeneratingAi}
                className="shadow-sm"
              >
                🤖 {aiAnalysis ? 'Regenerate AI Analysis' : 'Generate AI Analysis'}
              </Button>

              <Link href={`/review/${submission.id}`}>
                <Button variant="secondary" size="sm">
                  ⚖️ Review Workspace
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Executive Summary Highlight Banner */}
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

        {/* Overall Score Highlight Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/40 border border-sky-100 dark:border-sky-900/60 text-center min-w-44 shrink-0 shadow-inner">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Overall Score
          </div>
          <div className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">
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

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-2">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === 'kpi'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          📊 Balanced Scorecard & KPIs
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ai'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <span>🤖 AI Executive Analysis</span>
          {aiAnalysis && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'review'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <span>⚖️ CEO / Executive Review</span>
          {reviewFeedback && (
            <Badge
              variant={
                reviewFeedback.action === 'APPROVED' ? 'success' : 'warning'
              }
              size="sm"
            >
              {reviewFeedback.action}
            </Badge>
          )}
        </button>
      </div>

      {/* TAB 1: BSC Overview & KPI Detail */}
      {activeTab === 'kpi' && (
        <div className="space-y-8 animate-fade-in">
          {/* 4 BSC Perspectives Summary Cards */}
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
                          {e.achievement_pct !== undefined
                            ? `${e.achievement_pct}%`
                            : '—'}
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
      )}

      {/* TAB 2: AI Executive Analysis */}
      {activeTab === 'ai' && (
        <div className="space-y-8 animate-fade-in">
          {!aiAnalysis ? (
            <div className="p-12 rounded-3xl bg-[var(--card)] border border-[var(--border)] text-center space-y-4">
              <div className="text-4xl">🤖</div>
              <div className="font-bold text-base text-[var(--foreground)]">
                No AI Analysis Generated Yet
              </div>
              <p className="text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
                An automated executive assessment powered by Google Gemini AI will analyze performance across all 4 BSC perspectives.
              </p>
              {isReviewer && (
                <div className="pt-2">
                  <Button
                    onClick={handleGenerateAi}
                    isLoading={isGeneratingAi}
                    size="lg"
                  >
                    ⚡ Generate AI Analysis Now
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <h2 className="text-base font-bold text-[var(--foreground)]">
                      Executive Summary & Performance Narrative
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">
                      Model: {aiAnalysis.model_used}
                    </Badge>
                    {isReviewer && (
                      <button
                        onClick={() => setIsEditAiOpen(true)}
                        className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer ml-2"
                      >
                        ✏️ Edit Narrative
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-line bg-slate-50/70 dark:bg-slate-900/70 p-5 rounded-2xl border border-[var(--border)]">
                  {aiAnalysis.executive_summary}
                </div>
              </div>

              {/* Strengths & Improvement Areas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="p-6 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <span>🌟</span> Key Performance Strengths
                  </div>

                  <ul className="space-y-2.5">
                    {aiAnalysis.strengths?.map((s, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed"
                      >
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvement Areas */}
                <div className="p-6 rounded-3xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                    <span>🚩</span> Areas for Focus & Improvement
                  </div>

                  <ul className="space-y-2.5">
                    {aiAnalysis.improvement_areas?.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200 leading-relaxed"
                      >
                        <span className="text-amber-600 font-bold">!</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* BSC Perspective Insights */}
              <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    Balanced Scorecard Perspective Insights
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(aiAnalysis.perspective_analysis || {}).map(
                    ([perspective, narrative]) => (
                      <div
                        key={perspective}
                        className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-[var(--border)] space-y-1.5"
                      >
                        <div className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                          {perspective.replace(/_/g, ' ')}
                        </div>
                        <p className="text-xs text-[var(--foreground)] leading-relaxed">
                          {narrative}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-sky-50/60 to-cyan-50/60 dark:from-sky-950/30 dark:to-cyan-950/30 border border-sky-100 dark:border-sky-900/50 space-y-4">
                <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-sm">
                  <span>💡</span> Strategic Action Recommendations
                </div>

                <div className="space-y-2.5">
                  {aiAnalysis.recommendations?.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] leading-relaxed shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CEO / Executive Review */}
      {activeTab === 'review' && (
        <div className="space-y-8 animate-fade-in">
          {!reviewFeedback ? (
            <div className="p-12 rounded-3xl bg-[var(--card)] border border-[var(--border)] text-center space-y-4">
              <div className="text-4xl">⚖️</div>
              <div className="font-bold text-base text-[var(--foreground)]">
                Review Pending
              </div>
              <p className="text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
                This performance report has not yet been reviewed by executive leadership. The CEO or designated reviewer will evaluate results and sign off.
              </p>
              {isReviewer && (
                <div className="pt-2">
                  <Link href={`/review/${submission.id}`}>
                    <Button size="md">Go to Review Workspace →</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Review Decision Banner */}
              <div
                className={`p-8 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  reviewFeedback.action === 'APPROVED'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        reviewFeedback.action === 'APPROVED'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {reviewFeedback.action}
                    </Badge>
                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                      Official Executive Sign-off
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight mt-1">
                    {reviewFeedback.action === 'APPROVED'
                      ? 'Performance Report Approved'
                      : 'Returned for Revision'}
                  </h2>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    Reviewed by:{' '}
                    <strong className="text-[var(--foreground)]">
                      {reviewFeedback.reviewer
                        ? `${reviewFeedback.reviewer.first_name} ${reviewFeedback.reviewer.last_name}`
                        : 'CEO / Executive'}
                    </strong>{' '}
                    on {new Date(reviewFeedback.updated_at).toLocaleDateString()}
                  </div>
                </div>

                {isReviewer && (
                  <Link href={`/review/${submission.id}`}>
                    <Button variant="outline" size="sm">
                      ✏️ Edit Review
                    </Button>
                  </Link>
                )}
              </div>

              {/* Overall Executive Commentary */}
              <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Executive Assessment & Commentary
                </h3>
                <p className="text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-line bg-slate-50/70 dark:bg-slate-900/70 p-5 rounded-2xl border border-[var(--border)]">
                  {reviewFeedback.overall_feedback}
                </p>
              </div>

              {/* Perspective Specific Guidance if provided */}
              {reviewFeedback.perspective_feedback &&
                Object.values(reviewFeedback.perspective_feedback).some(
                  (v) => !!v,
                ) && (
                  <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Perspective-Specific Executive Direction
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(
                        reviewFeedback.perspective_feedback,
                      ).map(
                        ([perspective, advice]) =>
                          advice && (
                            <div
                              key={perspective}
                              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-[var(--border)] space-y-1"
                            >
                              <div className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                                {perspective.replace(/_/g, ' ')}
                              </div>
                              <p className="text-xs text-[var(--foreground)] leading-relaxed">
                                {advice}
                              </p>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}

              {/* Recommended Focus Areas */}
              {reviewFeedback.recommended_focus_areas &&
                reviewFeedback.recommended_focus_areas.length > 0 && (
                  <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Strategic Focus Directives for Next Period
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {reviewFeedback.recommended_focus_areas.map(
                        (tag, idx) => (
                          <span
                            key={idx}
                            className="px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold text-xs border border-sky-100 dark:border-sky-900"
                          >
                            🎯 {tag}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Edit AI Summary Modal */}
      <Modal
        isOpen={isEditAiOpen}
        onClose={() => setIsEditAiOpen(false)}
        title="Edit Executive Summary Narrative"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditedAi} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Executive Summary Text
            </label>
            <textarea
              rows={8}
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] leading-relaxed"
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditAiOpen(false)}
              disabled={isSavingAi}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSavingAi}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
