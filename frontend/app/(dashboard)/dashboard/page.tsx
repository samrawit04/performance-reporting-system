'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { RadarChart, RadarDataPoint } from '../../../components/charts/RadarChart';
import { TrendChart, TrendDataPoint } from '../../../components/charts/TrendChart';
import { DistributionBar } from '../../../components/charts/DistributionBar';

export default function DashboardPage() {
  const { user } = useAuth();
  const [managerData, setManagerData] = useState<any>(null);
  const [reviewerData, setReviewerData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [aggregationData, setAggregationData] = useState<any>(null);
  const [orgAggregationData, setOrgAggregationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (user.role === 'MANAGER') {
        const [res, agg] = await Promise.all([
          api.get<any>('/dashboard/manager'),
          api.get<any>('/aggregation/me').catch(() => null),
        ]);
        setManagerData(res);
        setAggregationData(agg);
      } else if (user.role === 'REVIEWER') {
        const [res, orgAgg] = await Promise.all([
          api.get<any>('/dashboard/reviewer'),
          api.get<any>('/aggregation/overview').catch(() => null),
        ]);
        setReviewerData(res);
        setOrgAggregationData(orgAgg);
      } else if (user.role === 'ADMIN') {
        const res = await api.get<any>('/dashboard/admin');
        setAdminData(res);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard metrics. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingBadgeVariant = (rating?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (rating) {
      case 'Excellent':
        return 'success';
      case 'Good':
        return 'info';
      case 'Satisfactory':
        return 'warning';
      case 'Needs Improvement':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'APPROVED':
      case 'FINALIZED':
        return 'success';
      case 'UNDER_REVIEW':
      case 'AI_ANALYZED':
        return 'warning';
      case 'CALCULATED':
        return 'info';
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-44 bg-[var(--border)] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-[var(--border)] rounded-2xl" />
          <div className="h-28 bg-[var(--border)] rounded-2xl" />
          <div className="h-28 bg-[var(--border)] rounded-2xl" />
          <div className="h-28 bg-[var(--border)] rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[var(--border)] rounded-3xl" />
          <div className="h-80 bg-[var(--border)] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="rounded-3xl p-8 text-white shadow-xl relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0d1b2a 0%, #0077b6 55%, #00b4d8 100%)'}}>
        <div className="relative z-10 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.first_name} {user?.last_name}!
          </h1>
          <p className="text-cyan-100 max-w-2xl text-sm leading-relaxed">
            Balanced Scorecard Executive Performance Management — evaluate achievements across Financial, Customer, Internal Process, and Learning & Growth perspectives.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANAGER VIEW                                                              */}
      {/* ========================================================================= */}
      {user?.role === 'MANAGER' && managerData && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                My Performance Overview
              </h2>
              <p className="text-xs text-[var(--muted)]">Balanced Scorecard metrics & historical progression</p>
            </div>
            <div className="flex gap-2">
              <Link href="/performance/new">
                <Button size="sm" className="gap-1.5 shadow-sm">
                  <span>+</span> New Submission
                </Button>
              </Link>
              <Link href="/performance/upload">
                <Button variant="outline" size="sm" className="gap-1.5 shadow-sm">
                  Upload Excel
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Latest Score Card */}
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Latest Score
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                  {managerData.latestScore ? `${managerData.latestScore.overallScore.toFixed(1)}%` : 'N/A'}
                </span>
                {managerData.latestScore?.overallRating && (
                  <Badge variant={getRatingBadgeVariant(managerData.latestScore.overallRating)}>
                    {managerData.latestScore.overallRating}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2 truncate">
                {managerData.latestScore?.periodLabel || 'No evaluated period yet'}
              </div>
            </div>

            {/* In-Review Submissions */}
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Under Review
              </div>
              <div className="text-3xl font-bold text-amber-600">
                {managerData.statusCounts?.underReview || 0}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">Awaiting CEO/COO evaluation</div>
            </div>

            {/* Approved Evaluations */}
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Approved Reports
              </div>
              <div className="text-3xl font-bold text-emerald-600">
                {managerData.statusCounts?.approved || 0}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">Finalized executive reports</div>
            </div>

            {/* Draft Submissions */}
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Drafts
              </div>
              <div className="text-3xl font-bold text-slate-500">
                {managerData.statusCounts?.draft || 0}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">Unsubmitted performance drafts</div>
            </div>
          </div>

          {/* Visualizations Grid: BSC Radar + Historical Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* BSC Radar Chart Card (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-[var(--foreground)]">
                    BSC 4 Perspectives Spider
                  </h3>
                  <span className="text-xs text-sky-600 font-semibold">Latest Evaluation</span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Performance balance across Financial, Customer, Process, and Learning.
                </p>
              </div>

              <div className="py-2 flex justify-center">
                <RadarChart data={managerData.radarScores || []} size={300} />
              </div>

              <div className="text-[11px] text-[var(--muted)] text-center border-t border-[var(--border)] pt-3">
                Aim for balanced polygon coverage across all four pillars.
              </div>
            </div>

            {/* Performance Trend Chart Card (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-[var(--foreground)]">
                    Performance Progression Trend
                  </h3>
                  <span className="text-xs text-emerald-600 font-semibold">Target: 80.0%</span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Overall score trend across recent reporting cycles.
                </p>
              </div>

              <div className="py-4">
                <TrendChart data={managerData.trends || []} height={220} />
              </div>

              {/* Perspective breakdown bars */}
              <div className="border-t border-[var(--border)] pt-4 space-y-2">
                <div className="text-xs font-bold text-[var(--foreground)] mb-2">
                  Perspective Score Details
                </div>
                <DistributionBar
                  items={(managerData.radarScores || []).map((r: any) => ({
                    label: r.label,
                    value: r.score,
                    total: 100,
                    badge: r.rating !== 'N/A' ? r.rating : undefined,
                    color:
                      r.perspective === 'FINANCIAL'
                        ? '#0077b6'
                        : r.perspective === 'CUSTOMER'
                        ? '#06b6d4'
                        : r.perspective === 'INTERNAL_PROCESS'
                        ? '#00b4d8'
                        : '#10b981',
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Quarterly & Annual Scorecard Rollup */}
          {aggregationData && (
            <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-[var(--foreground)]">
                    Quarterly BSC Scorecard &amp; Annual Rollup ({aggregationData.year})
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Aggregated rolling quarterly averages across the 4 Balanced Scorecard perspectives.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-[var(--muted)] block">
                      Annual Average
                    </span>
                    <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                      {aggregationData.yearlyAvgScore !== null
                        ? `${aggregationData.yearlyAvgScore}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {aggregationData.quarterly?.map((q: any) => (
                  <div
                    key={q.quarter}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/70 border border-[var(--border)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--foreground)]">
                        {q.quarter}
                      </span>
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                        {q.avgScore !== null ? `${q.avgScore}%` : 'No data'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-[var(--muted)]">
                      <div className="flex justify-between">
                        <span>Financial:</span>
                        <span className="font-mono text-[var(--foreground)]">
                          {q.avgPerspectiveScores?.FINANCIAL !== undefined
                            ? `${q.avgPerspectiveScores.FINANCIAL}%`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span className="font-mono text-[var(--foreground)]">
                          {q.avgPerspectiveScores?.CUSTOMER !== undefined
                            ? `${q.avgPerspectiveScores.CUSTOMER}%`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Internal Process:</span>
                        <span className="font-mono text-[var(--foreground)]">
                          {q.avgPerspectiveScores?.INTERNAL_PROCESS !== undefined
                            ? `${q.avgPerspectiveScores.INTERNAL_PROCESS}%`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Learning &amp; Growth:</span>
                        <span className="font-mono text-[var(--foreground)]">
                          {q.avgPerspectiveScores?.LEARNING_GROWTH !== undefined
                            ? `${q.avgPerspectiveScores.LEARNING_GROWTH}%`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Submissions Table */}
          <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[var(--foreground)]">
                Recent Performance Submissions
              </h3>
              <Link href="/performance" className="text-xs text-sky-600 font-bold hover:underline">
                View All Submissions →
              </Link>
            </div>

            {managerData.recentSubmissions?.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--muted)]">
                No submissions yet. Click "New Submission" or "Upload Excel" to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--muted)] font-bold uppercase tracking-wider">
                      <th className="pb-3">Reporting Period</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Score</th>
                      <th className="pb-3">Rating</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {managerData.recentSubmissions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-[var(--background)] transition-colors">
                        <td className="py-3.5 font-bold text-[var(--foreground)]">
                          {sub.periodLabel}
                        </td>
                        <td className="py-3.5">
                          <Badge variant={getStatusBadgeVariant(sub.status)}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 font-bold text-sky-600">
                          {sub.overallScore !== null ? `${sub.overallScore.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3.5">
                          {sub.overallRating ? (
                            <Badge variant={getRatingBadgeVariant(sub.overallRating)}>
                              {sub.overallRating}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 text-[var(--muted)]">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right">
                          <Link href={`/performance/${sub.id}`}>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* REVIEWER VIEW                                                             */}
      {/* ========================================================================= */}
      {user?.role === 'REVIEWER' && reviewerData && (
        <section className="space-y-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                CEO / COO Executive Evaluation Queue
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Review executive scorecards, AI narrative insights, and provide final advice
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/company-overview">
                <Button variant="outline" size="sm" className="gap-1.5 shadow-sm text-[#0077b6] border-[#0077b6]/30">
                  Company Overview
                </Button>
              </Link>
              <Link href="/review">
                <Button size="sm" className="gap-1.5 shadow-sm">
                  Open Review Queue ({reviewerData.pendingReviewsCount || 0})
                </Button>
              </Link>
            </div>
          </div>

          {/* Pending Reviews Cards */}
          {reviewerData.pendingReviewsCount > 0 ? (
            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl"></span>
                <div>
                  <h3 className="font-bold text-base text-amber-900 dark:text-amber-300">
                    {reviewerData.pendingReviewsCount} Submissions Awaiting Your Review
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    Calculated scores and Gemini AI analyses are ready for CEO evaluation and approval.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {reviewerData.pendingReviews.slice(0, 3).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-[var(--foreground)] truncate">
                        {item.executiveName}
                      </span>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-[var(--muted)]">{item.periodLabel}</div>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                      <span className="font-bold text-sky-600">
                        {item.overallScore !== null ? `${item.overallScore.toFixed(1)}%` : 'N/A'}
                      </span>
                      <Link href={`/review/${item.id}`}>
                        <Button size="sm" variant="primary">
                          Review Now →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center gap-3">
              <span className="text-xl"></span>
              <span>All submitted reports have been evaluated and approved. No pending reviews in queue.</span>
            </div>
          )}

          {/* Org Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Organization Average Score
              </div>
              <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                {reviewerData.avgOrgScore !== null ? `${reviewerData.avgOrgScore.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">Across all finalized evaluations</div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Total Submissions Pipeline
              </div>
              <div className="text-3xl font-bold text-[var(--foreground)]">
                {reviewerData.statusCounts?.total || 0}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">
                {reviewerData.statusCounts?.approved || 0} approved • {reviewerData.statusCounts?.underReview || 0} under review
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Rating Distribution
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(reviewerData.ratingDistribution || {}).map(([rating, count]: any) => (
                  <Badge key={rating} variant={getRatingBadgeVariant(rating)}>
                    {rating}: {count}
                  </Badge>
                ))}
                {Object.keys(reviewerData.ratingDistribution || {}).length === 0 && (
                  <span className="text-xs text-[var(--muted)]">No ratings yet</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ADMIN VIEW                                                                */}
      {/* ========================================================================= */}
      {user?.role === 'ADMIN' && adminData && (
        <section className="space-y-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                System Administration & Governance
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Platform health, scoring configuration governance, and audit trail
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/audit">
                <Button size="sm" variant="outline" className="gap-1.5 shadow-sm">
                  View Audit Logs
                </Button>
              </Link>
              <Link href="/settings">
                <Button size="sm" variant="outline" className="gap-1.5 shadow-sm">
                  System Config
                </Button>
              </Link>
            </div>
          </div>

          {/* Unconfirmed Business Rules Alert */}
          {adminData.systemHealth?.hasUnconfirmedConfig && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
              <span className="text-2xl mt-0.5"></span>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                  Unconfirmed Business Rules Notice
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                  The system is currently using temporary default scoring rules and rating thresholds. Once confirmed with leadership, mark them as confirmed in the{' '}
                  <Link href="/settings" className="font-bold underline">
                    System Config
                  </Link>{' '}
                  page.
                </p>
              </div>
            </div>
          )}

          {/* Platform Vital Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Total Users
              </div>
              <div className="text-3xl font-bold text-[var(--foreground)]">
                {adminData.platformStats?.totalUsers || 0}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">
                {adminData.platformStats?.usersByRole?.admin || 0} Admins •{' '}
                {adminData.platformStats?.usersByRole?.manager || 0} Managers •{' '}
                {adminData.platformStats?.usersByRole?.reviewer || 0} Reviewers
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Active KPI Definitions
              </div>
              <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                {adminData.platformStats?.totalKpis || 0}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">Across 4 BSC perspectives</div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Total Submissions
              </div>
              <div className="text-3xl font-bold text-[var(--foreground)]">
                {adminData.platformStats?.totalSubmissions || 0}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">Submitted through manual or Excel input</div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Pending Reviews
              </div>
              <div className="text-3xl font-bold text-amber-600">
                {adminData.platformStats?.pendingReviewsCount || 0}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">Awaiting executive review</div>
            </div>
          </div>

          {/* Recent Audit Logs Feed */}
          <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  Live Audit Activity Feed
                </h3>
                <p className="text-xs text-[var(--muted)]">Recent system state transitions & security events</p>
              </div>
              <Link href="/audit" className="text-xs text-sky-600 font-bold hover:underline">
                View Full Audit Trail →
              </Link>
            </div>

            <div className="divide-y divide-[var(--border)] text-xs">
              {adminData.recentAuditLogs?.map((log: any) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--foreground)] truncate">
                        {log.action} <span className="text-[var(--muted)] font-normal">on {log.entity}</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] truncate">
                        {log.userEmail || 'System'} ({log.userRole || 'ANON'})
                      </div>
                    </div>
                  </div>
                  <div className="text-[var(--muted)] whitespace-nowrap text-[11px]">
                    {new Date(log.createdAt).toLocaleTimeString()} • {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {adminData.recentAuditLogs?.length === 0 && (
                <div className="py-6 text-center text-sm text-[var(--muted)]">
                  No audit logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
