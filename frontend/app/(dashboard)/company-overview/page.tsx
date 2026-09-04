'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function CompanyOverviewPage() {
  const { user } = useAuth();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [orgData, setOrgData] = useState<any>(null);
  const [aiMacroSummary, setAiMacroSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyOverview(year);
  }, [year]);

  const fetchCompanyOverview = async (targetYear: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any>(`/aggregation/overview?year=${targetYear}`);
      setOrgData(data);
    } catch (err: any) {
      console.error('Failed to load company overview:', err);
      setError('Unable to load company overview. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiMacroSummary = async () => {
    setAiLoading(true);
    try {
      const summary = await api.get<any>(`/aggregation/ai-macro-summary?year=${year}`);
      setAiMacroSummary(summary);
    } catch (err: any) {
      alert('Failed to generate AI Macro Summary: ' + (err.message || 'Error occurred'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!orgData || !orgData.managers || orgData.managers.length === 0) {
      alert('No company performance data available to export.');
      return;
    }

    const headers = [
      'Manager / Executive',
      'Department',
      'Yearly Avg Score (%)',
      'Rating',
      'Submissions Logged',
      'Financial Score (%)',
      'Customer Score (%)',
      'Internal Process Score (%)',
      'Learning & Growth Score (%)',
    ];

    const rows = orgData.managers.map((m: any) => [
      `"${m.name}"`,
      `"${m.department || 'General'}"`,
      m.yearlyAvgScore !== null ? m.yearlyAvgScore : '',
      `"${m.overallRating || ''}"`,
      m.submissionCount,
      m.perspectiveScores?.FINANCIAL || '',
      m.perspectiveScores?.CUSTOMER || '',
      m.perspectiveScores?.INTERNAL_PROCESS || '',
      m.perspectiveScores?.LEARNING_GROWTH || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: string[]) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Company_Performance_Overview_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse p-6">
        <div className="h-36 bg-[var(--border)] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-[var(--border)] rounded-2xl" />
          <div className="h-28 bg-[var(--border)] rounded-2xl" />
          <div className="h-28 bg-[var(--border)] rounded-2xl" />
          <div className="h-28 bg-[var(--border)] rounded-2xl" />
        </div>
        <div className="h-96 bg-[var(--border)] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1b2a] via-[#0077b6] to-[#00b4d8] text-white p-8 md:p-10 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-cyan-200 uppercase bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Executive Governance Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-3">
              Company-Wide Performance Overview
            </h1>
            <p className="text-cyan-100 text-sm mt-1 max-w-2xl font-normal">
              Aggregated strategic evaluation across all departmental units, BSC perspectives, and leadership scorecards for {year}.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <option value={2026} className="text-slate-900">2026 Evaluation Period</option>
              <option value={2025} className="text-slate-900">2025 Evaluation Period</option>
            </select>
            <Button
              onClick={handleExportCsv}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm font-semibold rounded-xl"
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Company KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
          <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Overall Company Score
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <div className="text-3xl font-bold text-[var(--foreground)]">
              {orgData?.companyAvgScore !== null && orgData?.companyAvgScore !== undefined
                ? `${orgData.companyAvgScore}%`
                : '—'}
            </div>
            {orgData?.companyRating && (
              <Badge variant={getRatingBadgeVariant(orgData.companyRating)}>
                {orgData.companyRating}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">Weighted score across all departments</p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
          <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Reporting Departments
          </div>
          <div className="text-3xl font-bold text-[var(--foreground)] mt-3">
            {orgData?.managers?.length || 0} Units
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">Active managers submitting evaluations</p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
          <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Submission Health
          </div>
          <div className="text-3xl font-bold text-[var(--foreground)] mt-3">
            {orgData?.submissionStats?.approved || 0} / {orgData?.submissionStats?.total || 0}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">Approved vs Total Submissions Logged</p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
          <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Top Performing Unit
          </div>
          <div className="text-xl font-bold text-[#0077b6] truncate mt-3">
            {orgData?.managers?.[0]?.name || 'N/A'}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            {orgData?.managers?.[0]?.department || 'General'} — Score: {orgData?.managers?.[0]?.yearlyAvgScore ?? '—'}%
          </p>
        </div>
      </div>

      {/* Gemini AI Strategic Macro Summary Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0077b6] uppercase tracking-wider bg-sky-500/10 px-3 py-1 rounded-full">
              Gemini AI Executive Intelligence
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mt-1">
              Company Strategic Macro Analysis
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Synthesized company-wide narrative analyzing strengths, systemic risks, and key priorities for the CEO.
            </p>
          </div>
          <Button
            onClick={handleGenerateAiMacroSummary}
            disabled={aiLoading}
            className="bg-[#0077b6] hover:bg-[#005f93] text-white font-semibold rounded-xl text-sm px-5 py-2.5"
          >
            {aiLoading ? 'Generating AI Synthesis...' : 'Generate Company AI Analysis'}
          </Button>
        </div>

        {aiMacroSummary ? (
          <div className="space-y-6 text-sm">
            {/* Executive Summary */}
            <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
              <h3 className="font-bold text-[var(--foreground)] text-base mb-2">Executive Summary for CEO</h3>
              <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                {aiMacroSummary.executive_summary}
              </p>
            </div>

            {/* Strengths & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <h4 className="font-bold text-emerald-600 text-sm mb-3">Organizational Strengths</h4>
                <ul className="space-y-2 text-xs text-[var(--foreground)]">
                  {aiMacroSummary.company_strengths?.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <h4 className="font-bold text-amber-600 text-sm mb-3">Systemic Operational Risks</h4>
                <ul className="space-y-2 text-xs text-[var(--foreground)]">
                  {aiMacroSummary.systemic_risks?.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CEO Action Items */}
            {aiMacroSummary.ceo_action_items && (
              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <h4 className="font-bold text-[#0077b6] text-sm mb-3">CEO & Leadership Strategic Priorities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {aiMacroSummary.ceo_action_items.map((item: string, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] font-medium">
                      <span className="block text-[#0077b6] font-bold mb-1">Priority #{i + 1}</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)]">
            <p className="text-sm font-semibold text-[var(--foreground)]">No Macro AI Summary Generated Yet</p>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-md mx-auto">
              Click &quot;Generate Company AI Analysis&quot; above to synthesize all manager reports and view Gemini AI&apos;s executive strategic briefing.
            </p>
          </div>
        )}
      </div>

      {/* Balanced Scorecard Perspectives Breakdown */}
      <div className="p-6 md:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          Company Balanced Scorecard Averages
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { key: 'FINANCIAL', label: 'Financial Perspective', color: 'from-emerald-500 to-teal-600' },
            { key: 'CUSTOMER', label: 'Customer & Stakeholder', color: 'from-blue-500 to-cyan-600' },
            { key: 'INTERNAL_PROCESS', label: 'Internal Processes', color: 'from-indigo-500 to-purple-600' },
            { key: 'LEARNING_GROWTH', label: 'Organizational Growth', color: 'from-amber-500 to-orange-600' },
          ].map((item) => {
            const score = orgData?.companyPerspectiveScores?.[item.key] ?? null;
            return (
              <div key={item.key} className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-3">
                <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  {item.label}
                </div>
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {score !== null ? `${score}%` : '—'}
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, score || 0))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Leaderboard Table */}
      <div className="p-6 md:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Department Performance Leaderboard</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Ranked performance scores of all departmental managers for {year}</p>
          </div>
          <Badge variant="neutral">{orgData?.managers?.length || 0} Managers Total</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase font-bold text-[var(--muted)]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Manager / Executive</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Evaluations</th>
                <th className="py-3 px-4 text-right">Yearly Score</th>
                <th className="py-3 px-4 text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-normal text-[var(--foreground)]">
              {orgData?.managers && orgData.managers.length > 0 ? (
                orgData.managers.map((m: any, index: number) => (
                  <tr key={m.userId} className="hover:bg-[var(--background)] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-xs text-[var(--muted)]">#{index + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--foreground)]">{m.name}</td>
                    <td className="py-3.5 px-4 text-xs text-[var(--muted)] font-medium">{m.department || 'General'}</td>
                    <td className="py-3.5 px-4 text-center font-medium text-xs">{m.submissionCount}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-base text-[#0077b6]">
                      {m.yearlyAvgScore !== null ? `${m.yearlyAvgScore}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={getRatingBadgeVariant(m.overallRating)}>
                        {m.overallRating || 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--muted)]">
                    No manager performance evaluations found for {year}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
