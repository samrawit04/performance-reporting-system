'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { useAuth } from '../../../../context/auth-context';
import Link from 'next/link';

interface WeeklySection {
  perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL_PROCESS' | 'LEARNING_GROWTH';
  title: string;
  icon: string;
  objective: string;
  deliverable: string;
  plannedMilestone: number;
  actualProgress: number;
  notes: string;
}

export default function WeeklySnapshotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [weekLabel, setWeekLabel] = useState(
    `Weekly — 2026-W${Math.ceil((new Date().getDate() + 6) / 7)} (${new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })})`,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'MANAGER') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const [sections, setSections] = useState<WeeklySection[]>([
    {
      perspective: 'FINANCIAL',
      title: '1. Financial Perspective',
      icon: '💰',
      objective: 'Budget tracking & cost management',
      deliverable: 'Weekly expense reconciliations',
      plannedMilestone: 100,
      actualProgress: 95,
      notes: '',
    },
    {
      perspective: 'CUSTOMER',
      title: '2. Customer / Stakeholder Perspective',
      icon: '🤝',
      objective: 'Client SLA compliance & client satisfaction',
      deliverable: 'Weekly SLA delivery report',
      plannedMilestone: 100,
      actualProgress: 100,
      notes: '',
    },
    {
      perspective: 'INTERNAL_PROCESS',
      title: '3. Internal Process & Operations',
      icon: '⚙️',
      objective: 'Process turnaround time & quality control',
      deliverable: 'Operational throughput audit',
      plannedMilestone: 100,
      actualProgress: 90,
      notes: '',
    },
    {
      perspective: 'LEARNING_GROWTH',
      title: '4. Learning & Team Growth',
      icon: '🌱',
      objective: 'Team training, innovation & capabilities',
      deliverable: 'Weekly knowledge transfer session',
      plannedMilestone: 100,
      actualProgress: 100,
      notes: '',
    },
  ]);

  const handleSectionChange = (
    index: number,
    field: keyof WeeklySection,
    value: any,
  ) => {
    const updated = [...sections];
    updated[index] = {
      ...updated[index],
      [field]:
        field === 'plannedMilestone' || field === 'actualProgress'
          ? parseFloat(value) || 0
          : value,
    };
    setSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        period_type: 'WEEKLY',
        period_label: weekLabel.trim(),
        entries: sections.map((s) => ({
          perspective: s.perspective,
          objective: s.objective.trim() || `${s.title} Weekly Milestone`,
          deliverable: s.deliverable.trim() || undefined,
          measurement: '% milestone completion',
          unit: '%',
          weight: 1.0,
          plan_value: s.plannedMilestone || 100,
          actual_value: s.actualProgress || 0,
          notes: s.notes?.trim() || undefined,
        })),
      };

      const sub = await api.post<any>('/submissions', payload);
      // Auto-calculate & submit for review
      await api.post(`/submissions/${sub.id}/submit`);
      router.push(`/performance/${sub.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to record weekly snapshot');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Weekly Progress Snapshot
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Quick interim task and KPI progress check-in across the 4 Balanced Scorecard perspectives.
          </p>
        </div>

        <Link href="/performance">
          <Button variant="outline" size="sm">
            &larr; Back to Submissions
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cycle Identifier */}
        <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <Input
            label="Weekly Cycle Label"
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
            placeholder="e.g. Weekly — 2026-W35"
            required
          />
        </div>

        {/* 4 Balanced Scorecard Sections */}
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <div
              key={section.perspective}
              className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--foreground)] border-b border-[var(--border)] pb-3">
                <span className="text-lg">{section.icon}</span>
                <span>{section.title}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase mb-1">
                    Key Objective for the Week
                  </label>
                  <input
                    type="text"
                    value={section.objective}
                    onChange={(e) =>
                      handleSectionChange(idx, 'objective', e.target.value)
                    }
                    placeholder="e.g. Control operational expenditure"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase mb-1">
                    Deliverable / Concrete Output
                  </label>
                  <input
                    type="text"
                    value={section.deliverable}
                    onChange={(e) =>
                      handleSectionChange(idx, 'deliverable', e.target.value)
                    }
                    placeholder="e.g. Reconciled budget spreadsheet"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase mb-1">
                    Target Milestone (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={section.plannedMilestone}
                    onChange={(e) =>
                      handleSectionChange(idx, 'plannedMilestone', e.target.value)
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs font-mono text-[var(--foreground)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase mb-1">
                    Actual Progress Achieved (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={section.actualProgress}
                    onChange={(e) =>
                      handleSectionChange(idx, 'actualProgress', e.target.value)
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs font-mono font-bold text-sky-600 dark:text-sky-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase mb-1">
                    Status / Highlight Notes
                  </label>
                  <input
                    type="text"
                    value={section.notes}
                    onChange={(e) =>
                      handleSectionChange(idx, 'notes', e.target.value)
                    }
                    placeholder="e.g. On track, no blockers"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs text-[var(--muted)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Link href="/performance">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>

          <Button type="submit" isLoading={isSubmitting} size="lg">
            ⚡ Save &amp; Record Weekly Snapshot &rarr;
          </Button>
        </div>
      </form>
    </div>
  );
}
