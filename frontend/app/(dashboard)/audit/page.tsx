'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

interface AuditLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity', entityFilter);

      const res = await api.get<any>(`/audit?${params.toString()}`);
      setLogs(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError('Unable to load audit logs. Please verify administrator permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('APPROVED') || action.includes('SUCCESS') || action.includes('CREATED')) {
      return 'success';
    }
    if (action.includes('DEACTIVATED') || action.includes('FAILURE') || action.includes('DELETED')) {
      return 'danger';
    }
    if (action.includes('RETURNED') || action.includes('UPDATED')) {
      return 'warning';
    }
    return 'info';
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <span className="text-4xl">🔒</span>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Administrator Access Only</h2>
        <p className="text-xs text-[var(--muted)]">
          Audit logs contain security and governance tracking accessible only by System Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Security & Governance Audit Trail
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Immutable log of all user activities, state transitions, scoring recalculations, and config edits
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLogs()} className="self-start gap-1.5 shadow-xs">
          <span>🔄</span> Refresh Logs
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <span className="text-[var(--muted)] text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by user email, action, entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs text-[var(--foreground)] focus:outline-none placeholder:text-[var(--muted)]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
            <option value="SUBMISSION_CREATED">SUBMISSION_CREATED</option>
            <option value="SUBMISSION_UPDATED">SUBMISSION_UPDATED</option>
            <option value="SUBMISSION_SUBMITTED">SUBMISSION_SUBMITTED</option>
            <option value="SCORES_CALCULATED">SCORES_CALCULATED</option>
            <option value="REPORT_APPROVED">REPORT_APPROVED</option>
            <option value="REVIEW_RETURNED">REVIEW_RETURNED</option>
            <option value="CONFIG_UPDATED">CONFIG_UPDATED</option>
            <option value="RATING_THRESHOLDS_UPDATED">RATING_THRESHOLDS_UPDATED</option>
            <option value="KPI_CREATED">KPI_CREATED</option>
            <option value="KPI_UPDATED">KPI_UPDATED</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="PerformanceSubmission">PerformanceSubmission</option>
            <option value="ScoringConfig">ScoringConfig</option>
            <option value="RatingThreshold">RatingThreshold</option>
            <option value="KpiDefinition">KpiDefinition</option>
          </select>

          <Button type="submit" size="sm" variant="primary">
            Filter
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[var(--muted)]">Loading audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <span className="text-4xl">📜</span>
            <h3 className="font-bold text-base text-[var(--foreground)]">No Audit Records Found</h3>
            <p className="text-xs text-[var(--muted)]">
              No audit logs match the current search filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[var(--muted)] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">User / Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Entity</th>
                  <th className="py-3.5 px-6">Target ID</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--background)] transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap text-[var(--muted)] font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-[var(--foreground)]">{log.userEmail || 'System'}</div>
                      <div className="text-[10px] text-[var(--muted)] font-semibold uppercase">
                        {log.userRole || 'ANONYMOUS'}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-[var(--foreground)]">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[10px] text-[var(--muted)] truncate max-w-[120px]">
                      {log.entityId || '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--background)] hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold text-[11px] border border-[var(--border)] transition-colors"
                        >
                          View Payload
                        </button>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
          <div>
            Showing <span className="font-bold text-[var(--foreground)]">{logs.length}</span> of{' '}
            <span className="font-bold text-[var(--foreground)]">{total}</span> events
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="px-2 font-bold text-[var(--foreground)]">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* JSON Payload Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Payload: ${selectedLog.action}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--background)] p-3.5 rounded-xl border border-[var(--border)]">
              <div>
                <span className="text-[var(--muted)] block">Actor:</span>
                <span className="font-bold">{selectedLog.userEmail || 'System'}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">Role:</span>
                <span className="font-bold">{selectedLog.userRole || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">Entity:</span>
                <span className="font-bold">{selectedLog.entity}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">Timestamp:</span>
                <span className="font-bold">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--foreground)]">Recorded Changes / Payload:</label>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-64">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
