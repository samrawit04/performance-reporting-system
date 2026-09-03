'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api';
import {
  KpiDefinition,
  BscPerspective,
  RatingThreshold,
  ScoringConfigMap,
} from '../../../lib/types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'kpi' | 'scoring' | 'thresholds'>(
    'kpi',
  );

  // KPI Definitions state
  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [kpiFormLoading, setKpiFormLoading] = useState(false);

  // New KPI Form State
  const [kpiPerspective, setKpiPerspective] =
    useState<BscPerspective>('FINANCIAL');
  const [kpiObjective, setKpiObjective] = useState('');
  const [kpiMeasurement, setKpiMeasurement] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');
  const [kpiDescription, setKpiDescription] = useState('');

  // Scoring Configs state
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfigMap>({});
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // Rating Thresholds state
  const [thresholds, setThresholds] = useState<RatingThreshold[]>([]);
  const [loadingThresholds, setLoadingThresholds] = useState(true);

  const fetchKpis = async () => {
    try {
      setLoadingKpis(true);
      const data = await api.get<KpiDefinition[]>('/kpi/definitions?all=true');
      setKpis(data);
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    } finally {
      setLoadingKpis(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const data = await api.get<ScoringConfigMap>('/kpi/config/scoring');
      setScoringConfigs(data);
    } catch (err) {
      console.error('Failed to load scoring configs:', err);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const fetchThresholds = async () => {
    try {
      setLoadingThresholds(true);
      const data = await api.get<RatingThreshold[]>(
        '/kpi/config/rating-thresholds',
      );
      setThresholds(data);
    } catch (err) {
      console.error('Failed to load thresholds:', err);
    } finally {
      setLoadingThresholds(false);
    }
  };

  useEffect(() => {
    fetchKpis();
    fetchConfigs();
    fetchThresholds();
  }, []);

  const handleCreateKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setKpiFormLoading(true);
    try {
      await api.post('/kpi/definitions', {
        perspective: kpiPerspective,
        objective: kpiObjective,
        measurement: kpiMeasurement,
        unit: kpiUnit,
        description: kpiDescription || undefined,
      });
      setIsKpiModalOpen(false);
      setKpiObjective('');
      setKpiMeasurement('');
      setKpiUnit('');
      setKpiDescription('');
      await fetchKpis();
    } catch (err: any) {
      alert(err.message || 'Failed to create KPI definition');
    } finally {
      setKpiFormLoading(false);
    }
  };

  const handleToggleKpi = async (id: string) => {
    try {
      await api.patch(`/kpi/definitions/${id}/toggle-active`);
      await fetchKpis();
    } catch (err: any) {
      alert(err.message || 'Failed to update KPI status');
    }
  };

  const getPerspectiveBadge = (perspective: BscPerspective) => {
    switch (perspective) {
      case 'FINANCIAL':
        return <Badge variant="primary">Financial</Badge>;
      case 'CUSTOMER':
        return <Badge variant="info">Customer</Badge>;
      case 'INTERNAL_PROCESS':
        return <Badge variant="warning">Internal Process</Badge>;
      case 'LEARNING_GROWTH':
        return <Badge variant="success">Learning & Growth</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            System Configuration & KPI Rules
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Configure Balanced Scorecard templates, scoring caps, weights, and rating thresholds.
          </p>
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
          📋 Standard KPI Templates
        </button>
        <button
          onClick={() => setActiveTab('scoring')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === 'scoring'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
           Scoring & Weighting Rules
        </button>
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === 'thresholds'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
           Rating Thresholds
        </button>
      </div>

      {/* TAB 1: KPI Definitions */}
      {activeTab === 'kpi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">
              Pre-defined KPI templates available for managers during manual entry.
            </span>
            <Button size="sm" onClick={() => setIsKpiModalOpen(true)}>
              + Add KPI Template
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] text-xs uppercase font-bold text-[var(--muted)] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Perspective</th>
                  <th className="px-6 py-3.5">Objective</th>
                  <th className="px-6 py-3.5">Measurement</th>
                  <th className="px-6 py-3.5">Unit</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loadingKpis ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                      Loading KPI definitions...
                    </td>
                  </tr>
                ) : kpis.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                      No KPI definitions created yet.
                    </td>
                  </tr>
                ) : (
                  kpis.map((k) => (
                    <tr
                      key={k.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">{getPerspectiveBadge(k.perspective)}</td>
                      <td className="px-6 py-4 font-semibold text-[var(--foreground)]">
                        {k.objective}
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--muted)]">
                        {k.measurement}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium">
                        {k.unit}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={k.is_active ? 'success' : 'danger'} size="sm">
                          {k.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleKpi(k.id)}
                        >
                          {k.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Scoring Rules */}
      {activeTab === 'scoring' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
             <strong>Notice on Business Rules:</strong> The client has not confirmed the final weighting formulas. The values below are configurable provisional defaults.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Score Cap Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--foreground)]">
                  Score Cap (Maximum KPI Score)
                </h3>
                <Badge variant={scoringConfigs.score_cap?.is_confirmed ? 'success' : 'warning'}>
                  {scoringConfigs.score_cap?.is_confirmed ? 'Confirmed' : 'Provisional'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted)]">
                {scoringConfigs.score_cap?.description || 'Maximum score cap for each KPI.'}
              </p>
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {scoringConfigs.score_cap?.value ?? 100}%
              </div>
            </div>

            {/* Achievement Formula Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--foreground)]">
                  Achievement Formula
                </h3>
                <Badge variant={scoringConfigs.achievement_formula?.is_confirmed ? 'success' : 'warning'}>
                  {scoringConfigs.achievement_formula?.is_confirmed ? 'Confirmed' : 'Provisional'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted)]">
                {scoringConfigs.achievement_formula?.description || 'Formula used to calculate achievement %.'}
              </p>
              <div className="text-sm font-mono font-bold text-[var(--primary)] bg-[var(--primary-light)]/40 px-3 py-1.5 rounded-lg inline-block">
                Achievement % = (Actual / Plan) × 100
              </div>
            </div>

            {/* Perspective Weights Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--foreground)]">
                  BSC Perspective Weights in Overall Score
                </h3>
                <Badge variant={scoringConfigs.perspective_weights?.is_confirmed ? 'success' : 'warning'}>
                  {scoringConfigs.perspective_weights?.is_confirmed ? 'Confirmed' : 'Provisional'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Weight assigned to each Balanced Scorecard perspective when computing the overall executive score.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-center">
                  <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                    Financial
                  </div>
                  <div className="text-lg font-bold mt-1">25%</div>
                </div>
                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-center">
                  <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                    Customer
                  </div>
                  <div className="text-lg font-bold mt-1">25%</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Internal Process
                  </div>
                  <div className="text-lg font-bold mt-1">25%</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Learning & Growth
                  </div>
                  <div className="text-lg font-bold mt-1">25%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Rating Thresholds */}
      {activeTab === 'thresholds' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
             <strong>Rating Thresholds:</strong> These bracket ranges determine whether an achievement score is labeled Excellent, Good, Satisfactory, or Needs Improvement.
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] text-xs uppercase font-bold text-[var(--muted)] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Rating Label</th>
                  <th className="px-6 py-3.5">Minimum Score</th>
                  <th className="px-6 py-3.5">Maximum Score</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loadingThresholds ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--muted)]">
                      Loading thresholds...
                    </td>
                  </tr>
                ) : (
                  thresholds.map((t, idx) => (
                    <tr
                      key={t.id || idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-[var(--foreground)]">
                        {t.label}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{t.min_score}%</td>
                      <td className="px-6 py-4 font-mono text-xs">{t.max_score}%</td>
                      <td className="px-6 py-4">
                        <Badge variant={t.is_confirmed ? 'success' : 'warning'} size="sm">
                          {t.is_confirmed ? 'Confirmed' : 'Provisional'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create KPI Modal */}
      <Modal
        isOpen={isKpiModalOpen}
        onClose={() => setIsKpiModalOpen(false)}
        title="Add Standard KPI Template"
      >
        <form onSubmit={handleCreateKpi} className="space-y-4">
          <Select
            label="BSC Perspective"
            value={kpiPerspective}
            onChange={(e) => setKpiPerspective(e.target.value as BscPerspective)}
            options={[
              { value: 'FINANCIAL', label: 'Financial' },
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'INTERNAL_PROCESS', label: 'Internal Process' },
              { value: 'LEARNING_GROWTH', label: 'Learning & Growth' },
            ]}
          />

          <Input
            label="Strategic Objective"
            placeholder="e.g. Reduce customer onboarding cycle"
            value={kpiObjective}
            onChange={(e) => setKpiObjective(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Measurement Description"
              placeholder="e.g. Average days to complete onboarding"
              value={kpiMeasurement}
              onChange={(e) => setKpiMeasurement(e.target.value)}
              required
            />
            <Input
              label="Unit of Measure"
              placeholder="e.g. days, %, USD, count"
              value={kpiUnit}
              onChange={(e) => setKpiUnit(e.target.value)}
              required
            />
          </div>

          <Input
            label="Description / Context (Optional)"
            placeholder="Detailed notes on how this metric is captured"
            value={kpiDescription}
            onChange={(e) => setKpiDescription(e.target.value)}
          />

          <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsKpiModalOpen(false)}
              disabled={kpiFormLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={kpiFormLoading}>
              Save KPI Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
