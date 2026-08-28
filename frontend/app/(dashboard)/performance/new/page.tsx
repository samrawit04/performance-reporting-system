'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/auth-context';
import { api } from '../../../../lib/api';
import {
  BscPerspective,
  KpiDefinition,
  PeriodType,
  PerformanceEntry,
} from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';

export default function NewPerformancePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [periodLabel, setPeriodLabel] = useState('Monthly — 2026-08');
  const [templates, setTemplates] = useState<KpiDefinition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Table rows with 7 fields
  const [entries, setEntries] = useState<
    Omit<PerformanceEntry, 'id' | 'submission_id'>[]
  >([
    {
      perspective: 'FINANCIAL',
      objective: 'Control operating cost',
      measurement: '% budget variance',
      unit: '%',
      plan_value: 5.0,
      actual_value: 4.2,
      notes: '',
    },
  ]);

  useEffect(() => {
    // Load standard templates for pre-fill
    api
      .get<KpiDefinition[]>('/kpi/definitions')
      .then((data) => setTemplates(data))
      .catch(() => {});
  }, []);

  const handlePreFillTemplates = () => {
    if (templates.length === 0) {
      alert('No KPI templates found to pre-fill.');
      return;
    }
    const prefilled = templates.map((t) => ({
      kpi_definition_id: t.id,
      perspective: t.perspective,
      objective: t.objective,
      measurement: t.measurement,
      unit: t.unit,
      plan_value: 0,
      actual_value: 0,
      notes: '',
    }));
    setEntries(prefilled);
  };

  const handleAddRow = () => {
    setEntries([
      ...entries,
      {
        perspective: 'FINANCIAL',
        objective: '',
        measurement: '',
        unit: '%',
        plan_value: 0,
        actual_value: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleRowChange = (
    index: number,
    field: keyof PerformanceEntry,
    value: any,
  ) => {
    const updated = [...entries];
    updated[index] = {
      ...updated[index],
      [field]:
        field === 'plan_value' || field === 'actual_value'
          ? parseFloat(value) || 0
          : value,
    };
    setEntries(updated);
  };

  const handleSubmit = async (submitForReview = false) => {
    setError(null);

    // Validation
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e.objective.trim()) {
        setError(`Row ${i + 1}: Objective cannot be empty.`);
        return;
      }
      if (e.plan_value <= 0) {
        setError(`Row ${i + 1}: Plan value must be greater than 0.`);
        return;
      }
      if (e.actual_value < 0) {
        setError(`Row ${i + 1}: Actual value cannot be negative.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const submission = await api.post<any>('/submissions', {
        period_type: periodType,
        period_label: periodLabel,
        entries: entries.map((e) => ({
          kpi_definition_id: e.kpi_definition_id,
          perspective: e.perspective,
          objective: e.objective.trim(),
          measurement: e.measurement.trim() || 'Metric',
          unit: e.unit.trim() || '%',
          plan_value: e.plan_value,
          actual_value: e.actual_value,
          notes: e.notes?.trim() || undefined,
        })),
      });

      if (submitForReview) {
        await api.post(`/submissions/${submission.id}/submit`);
      }

      router.push(`/performance/${submission.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save submission.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Manual Performance Entry
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Enter performance metrics across the 4 Balanced Scorecard perspectives.
          </p>
        </div>

        <div className="flex gap-2">
          {templates.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreFillTemplates}
            >
              ⚡ Pre-fill from Standard Templates
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
          >
            + Add Row
          </Button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Submission Metadata */}
      <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Evaluation Period Metadata
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Period Label"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            placeholder="e.g. Monthly — 2026-08"
            required
          />

          <Select
            label="Reporting Cadence"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            options={[
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'QUARTERLY', label: 'Quarterly' },
              { value: 'WEEKLY', label: 'Weekly' },
              { value: 'YEARLY', label: 'Yearly' },
            ]}
          />
        </div>
      </div>

      {/* 7-Column Interactive Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] uppercase font-bold text-[var(--muted)] tracking-wider">
              <tr>
                <th className="px-4 py-3 w-40">1. Perspective</th>
                <th className="px-4 py-3 min-w-56">2. Strategic Objective</th>
                <th className="px-4 py-3 min-w-44">3. Measurement</th>
                <th className="px-4 py-3 w-24">4. Unit</th>
                <th className="px-4 py-3 w-28">5. Plan</th>
                <th className="px-4 py-3 w-28">6. Actual</th>
                <th className="px-4 py-3 min-w-44">7. Notes (Optional)</th>
                <th className="px-3 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {entries.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <select
                      value={row.perspective}
                      onChange={(e) =>
                        handleRowChange(
                          idx,
                          'perspective',
                          e.target.value as BscPerspective,
                        )
                      }
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      <option value="FINANCIAL">Financial</option>
                      <option value="CUSTOMER">Customer</option>
                      <option value="INTERNAL_PROCESS">Internal Process</option>
                      <option value="LEARNING_GROWTH">Learning & Growth</option>
                    </select>
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.objective}
                      onChange={(e) =>
                        handleRowChange(idx, 'objective', e.target.value)
                      }
                      placeholder="Objective"
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.measurement}
                      onChange={(e) =>
                        handleRowChange(idx, 'measurement', e.target.value)
                      }
                      placeholder="e.g. % budget variance"
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) =>
                        handleRowChange(idx, 'unit', e.target.value)
                      }
                      placeholder="%"
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs text-[var(--foreground)] font-mono focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      value={row.plan_value || ''}
                      onChange={(e) =>
                        handleRowChange(idx, 'plan_value', e.target.value)
                      }
                      placeholder="0.0"
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs font-mono text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      value={row.actual_value !== undefined ? row.actual_value : ''}
                      onChange={(e) =>
                        handleRowChange(idx, 'actual_value', e.target.value)
                      }
                      placeholder="0.0"
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs font-mono text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.notes || ''}
                      onChange={(e) =>
                        handleRowChange(idx, 'notes', e.target.value)
                      }
                      placeholder="Optional notes"
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </td>

                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={entries.length <= 1}
                      className="text-slate-400 hover:text-red-500 disabled:opacity-20 cursor-pointer text-sm"
                      title="Remove Row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddRow}
          disabled={isSubmitting}
        >
          + Add Another KPI Row
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(false)}
            isLoading={isSubmitting}
          >
            Save as Draft
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            isLoading={isSubmitting}
            size="md"
          >
            Calculate & Submit for Review →
          </Button>
        </div>
      </div>
    </div>
  );
}
