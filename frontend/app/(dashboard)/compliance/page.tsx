'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { User, PerformanceSubmission } from '../../../lib/types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/auth-context';

interface ManagerComplianceRow {
  manager: User;
  submission?: PerformanceSubmission;
  status: 'SUBMITTED' | 'APPROVED' | 'DRAFT' | 'MISSING';
}

export default function ComplianceDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<PerformanceSubmission[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly — 2026-08');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usersData, subsData] = await Promise.all([
          api.get<User[]>('/users'),
          api.get<PerformanceSubmission[]>('/submissions'),
        ]);
        setUsers(usersData.filter((u) => u.role === 'MANAGER' && u.is_active));
        setSubmissions(subsData);
      } catch (err) {
        console.error('Failed to load compliance data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  // Distinct periods from submissions
  const periodOptions = Array.from(
    new Set([
      'Monthly — 2026-08',
      'Monthly — 2026-07',
      'Monthly — 2026-06',
      ...submissions.map((s) => s.period_label),
    ]),
  );

  // Distinct departments
  const departments = Array.from(
    new Set(users.map((u) => u.department).filter(Boolean)),
  ) as string[];

  // Build compliance rows
  const complianceRows: ManagerComplianceRow[] = users.map((manager) => {
    const sub = submissions.find(
      (s) =>
        (s.executive_id === manager.id || s.submitted_by === manager.id) &&
        s.period_label.trim().toLowerCase() === selectedPeriod.trim().toLowerCase(),
    );

    let status: ManagerComplianceRow['status'] = 'MISSING';
    if (sub) {
      if (sub.status === 'APPROVED' || sub.status === 'FINALIZED') {
        status = 'APPROVED';
      } else if (
        sub.status === 'SUBMITTED' ||
        sub.status === 'CALCULATED' ||
        sub.status === 'AI_ANALYZED'
      ) {
        status = 'SUBMITTED';
      } else if (sub.status === 'DRAFT' || sub.status === 'UNDER_REVIEW') {
        status = 'DRAFT';
      }
    }

    return { manager, submission: sub, status };
  });

  const filteredRows = complianceRows.filter((r) => {
    if (selectedDepartment !== 'ALL' && r.manager.department !== selectedDepartment) {
      return false;
    }
    return true;
  });

  const totalCount = filteredRows.length;
  const submittedCount = filteredRows.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'APPROVED',
  ).length;
  const missingCount = filteredRows.filter((r) => r.status === 'MISSING').length;
  const complianceRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Executive Reporting Compliance Tracker
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Monitor submission status, reporting adherence, and compliance rates across departments for each cycle.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--muted)] uppercase">Cycle:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] outline-none"
          >
            {periodOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compliance Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Total Required Managers
          </div>
          <div className="text-2xl font-black text-[var(--foreground)] mt-2">
            {totalCount}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            Active reporting executives
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Compliance Rate
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-2">
            {complianceRate}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                complianceRate >= 80 ? 'bg-emerald-500' : complianceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${complianceRate}%` }}
            ></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Submitted / Approved
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {submittedCount}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            Reports ready or signed off
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Missing Submissions
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {missingCount}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            Pending management action
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div className="text-sm font-bold text-[var(--foreground)]">
          Department Compliance Breakdown
        </div>

        <div className="flex gap-2">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] uppercase font-bold text-[var(--muted)] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Manager / Executive</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status for {selectedPeriod}</th>
                <th className="px-6 py-3.5">Overall Score</th>
                <th className="px-6 py-3.5">Submission Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading compliance roster...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                    No managers found in this department.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  return (
                    <tr
                      key={row.manager.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-[var(--foreground)] text-sm">
                          {row.manager.first_name} {row.manager.last_name}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {row.manager.email}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                        {row.manager.department || 'General'}
                      </td>

                      <td className="px-6 py-4">
                        {row.status === 'APPROVED' && (
                          <Badge variant="success">✅ Approved</Badge>
                        )}
                        {row.status === 'SUBMITTED' && (
                          <Badge variant="primary">📋 Submitted</Badge>
                        )}
                        {row.status === 'DRAFT' && (
                          <Badge variant="warning">⏳ In Progress</Badge>
                        )}
                        {row.status === 'MISSING' && (
                          <Badge variant="danger">❌ Not Submitted</Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-sm">
                        {row.submission?.overall_score !== null &&
                        row.submission?.overall_score !== undefined
                          ? `${row.submission.overall_score}%`
                          : '—'}
                      </td>

                      <td className="px-6 py-4 text-[var(--muted)]">
                        {row.submission?.created_at
                          ? new Date(row.submission.created_at).toLocaleDateString()
                          : '—'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {row.submission ? (
                          <Link href={`/performance/${row.submission.id}`}>
                            <Button size="sm" variant="outline">
                              View Report &rarr;
                            </Button>
                          </Link>
                        ) : (
                          <a
                            href={`mailto:${row.manager.email}?subject=Reminder: Performance Submission Due for ${selectedPeriod}&body=Hello ${row.manager.first_name},%0D%0A%0D%0APlease be reminded to submit your Balanced Scorecard performance report for ${selectedPeriod}.%0D%0A%0D%0AThank you,%0D%0AExecutive Operations`}
                          >
                            <Button size="sm" variant="secondary">
                              📧 Send Reminder
                            </Button>
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
