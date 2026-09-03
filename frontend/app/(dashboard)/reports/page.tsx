'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/auth-context';

export default function FinalReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/compliance');
      return;
    }
    fetchReports();
  }, [user, router]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any[]>('/reports');
      setReports(data || []);
    } catch (err: any) {
      console.error('Failed to load final reports:', err);
      setError('Unable to load final executive reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (id: string, periodLabel: string) => {
    setDownloadingId(id);
    try {
      const cleanLabel = (periodLabel || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      await api.downloadPdf(`/reports/${id}/pdf`, `Performance_Report_${cleanLabel}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF report');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportCsv = () => {
    if (filteredReports.length === 0) {
      alert('No reports to export.');
      return;
    }

    const headers = [
      'Executive Name',
      'Department',
      'Reporting Period',
      'Cadence',
      'Overall Score (%)',
      'Overall Rating',
      'Status',
      'Date Submitted',
    ];

    const rows = filteredReports.map((r) => [
      `"${r.executive ? `${r.executive.first_name} ${r.executive.last_name}` : 'Unknown'}"`,
      `"${r.executive?.department || 'General'}"`,
      `"${r.period_label || ''}"`,
      `"${r.period_type || 'MONTHLY'}"`,
      r.overall_score !== null && r.overall_score !== undefined ? r.overall_score : '',
      `"${r.overall_rating || ''}"`,
      `"${r.status || ''}"`,
      `"${new Date(r.created_at).toLocaleDateString()}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Executive_Performance_Summary_${new Date().toISOString().slice(0, 10)}.csv`,
    );
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

  const departments = Array.from(
    new Set(
      reports
        .map((r) => r.executive?.department)
        .filter(Boolean) as string[],
    ),
  );

  const filteredReports = reports.filter((r) => {
    const executiveName = r.executive ? `${r.executive.first_name} ${r.executive.last_name}` : '';
    const label = r.period_label || '';
    const q = search.toLowerCase();
    const matchesSearch =
      executiveName.toLowerCase().includes(q) || label.toLowerCase().includes(q);
    const matchesDept =
      departmentFilter === 'ALL' || r.executive?.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Final Executive Performance Reports
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Browse, export consolidated summaries, and download approved Balanced Scorecard executive evaluation PDFs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 shadow-xs"
          >
            Export Summary (CSV)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="gap-1.5 shadow-xs"
          >
            <span>🔄</span> Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
        
        <input
          type="text"
          placeholder="Search by executive name or reporting period..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-transparent border-none text-xs text-[var(--foreground)] focus:outline-none placeholder:text-[var(--muted)]"
        />

        {departments.length > 0 && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] pr-2"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Reports Table */}
      <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[var(--muted)]">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <span className="text-4xl"></span>
            <h3 className="font-bold text-base text-[var(--foreground)]">No Approved Reports Found</h3>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              Executive reports will appear here once submitted performance figures are evaluated and approved by the CEO/COO.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[var(--muted)] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Executive Name</th>
                  <th className="py-3.5 px-6">Reporting Period</th>
                  <th className="py-3.5 px-6">Overall Score</th>
                  <th className="py-3.5 px-6">Rating</th>
                  <th className="py-3.5 px-6">Approved Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredReports.map((report) => {
                  const execName = report.executive
                    ? `${report.executive.first_name} ${report.executive.last_name}`
                    : 'Executive';
                  const isDownloading = downloadingId === report.id;

                  return (
                    <tr key={report.id} className="hover:bg-[var(--background)] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-[var(--foreground)]">{execName}</div>
                        <div className="text-[11px] text-[var(--muted)]">{report.executive?.department || 'Corporate'}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-[var(--foreground)]">
                        {report.period_label}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-black text-sky-600 dark:text-sky-400 text-sm">
                          {report.overall_score !== null ? `${Number(report.overall_score).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {report.overall_rating ? (
                          <Badge variant={getRatingBadgeVariant(report.overall_rating)}>
                            {report.overall_rating}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 px-6 text-[var(--muted)]">
                        {new Date(report.updated_at || report.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/performance/${report.id}`}>
                            <Button size="sm" variant="outline">
                              View Online
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleDownloadPdf(report.id, report.period_label)}
                            disabled={isDownloading}
                            className="gap-1 shadow-xs"
                          >
                            {isDownloading ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
