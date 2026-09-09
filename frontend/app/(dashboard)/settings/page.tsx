'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/auth-context';
import {
  KpiDefinition,
  BscPerspective,
  RatingThreshold,
} from '../../../lib/types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import {
  useKpiDefinitions,
  useRatingThresholds,
  useScoringConfigs,
  useUpdateScoringConfig,
  useUpdateRatingThresholds,
  useCreateKpi,
  useUpdateKpi,
  useToggleKpiActive,
  useDeleteKpi,
} from '../../../lib/hooks/useKpis';

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const [activeTab, setActiveTab] = useState<'kpi' | 'scoring' | 'thresholds'>('kpi');

  // TanStack Query Hooks
  const { data: kpis = [], isLoading: loadingKpis } = useKpiDefinitions(true);
  const { data: scoringConfigs = {}, isLoading: loadingConfigs } = useScoringConfigs();
  const { data: thresholds = [], isLoading: loadingThresholds } = useRatingThresholds();

  // Mutations
  const updateScoringConfigMutation = useUpdateScoringConfig();
  const updateThresholdsMutation = useUpdateRatingThresholds();
  const createKpiMutation = useCreateKpi();
  const updateKpiMutation = useUpdateKpi();
  const toggleKpiMutation = useToggleKpiActive();
  const deleteKpiMutation = useDeleteKpi();

  // Feedback banner state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  // --- KPI MODAL STATE ---
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiDefinition | null>(null);
  const [kpiPerspective, setKpiPerspective] = useState<BscPerspective>('FINANCIAL');
  const [kpiObjective, setKpiObjective] = useState('');
  const [kpiMeasurement, setKpiMeasurement] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');
  const [kpiDescription, setKpiDescription] = useState('');
  const [kpiWeight, setKpiWeight] = useState('1.0');

  const openAddKpiModal = () => {
    setEditingKpi(null);
    setKpiPerspective('FINANCIAL');
    setKpiObjective('');
    setKpiMeasurement('');
    setKpiUnit('');
    setKpiDescription('');
    setKpiWeight('1.0');
    setIsKpiModalOpen(true);
  };

  const openEditKpiModal = (kpi: KpiDefinition) => {
    setEditingKpi(kpi);
    setKpiPerspective(kpi.perspective);
    setKpiObjective(kpi.objective);
    setKpiMeasurement(kpi.measurement);
    setKpiUnit(kpi.unit);
    setKpiDescription(kpi.description || '');
    setKpiWeight(String(kpi.weight ?? 1.0));
    setIsKpiModalOpen(true);
  };

  const handleSaveKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKpi) {
        await updateKpiMutation.mutateAsync({
          id: editingKpi.id,
          data: {
            perspective: kpiPerspective,
            objective: kpiObjective,
            measurement: kpiMeasurement,
            unit: kpiUnit,
            description: kpiDescription || undefined,
            weight: parseFloat(kpiWeight) || 1.0,
          },
        });
        showSuccess('KPI template updated successfully.');
      } else {
        await createKpiMutation.mutateAsync({
          perspective: kpiPerspective,
          objective: kpiObjective,
          measurement: kpiMeasurement,
          unit: kpiUnit,
          description: kpiDescription || undefined,
          weight: parseFloat(kpiWeight) || 1.0,
        });
        showSuccess('New KPI template created successfully.');
      }
      setIsKpiModalOpen(false);
    } catch (err: any) {
      showError(err.message || 'Failed to save KPI definition.');
    }
  };

  const handleToggleKpi = async (id: string) => {
    try {
      await toggleKpiMutation.mutateAsync(id);
      showSuccess('KPI status updated.');
    } catch (err: any) {
      showError(err.message || 'Failed to update KPI status.');
    }
  };

  // --- SCORE CAP MODAL STATE ---
  const [isScoreCapModalOpen, setIsScoreCapModalOpen] = useState(false);
  const [scoreCapValue, setScoreCapValue] = useState('100');
  const [scoreCapDesc, setScoreCapDesc] = useState('');

  const openScoreCapModal = () => {
    const current = scoringConfigs.score_cap?.value ?? 100;
    setScoreCapValue(String(current));
    setScoreCapDesc(scoringConfigs.score_cap?.description || 'Maximum score cap for each KPI.');
    setIsScoreCapModalOpen(true);
  };

  const handleSaveScoreCap = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(scoreCapValue);
    if (isNaN(parsed) || parsed <= 0) {
      showError('Please enter a valid positive number for Score Cap.');
      return;
    }
    try {
      await updateScoringConfigMutation.mutateAsync({
        key: 'score_cap',
        value: { value: parsed },
        is_confirmed: true,
      });
      setIsScoreCapModalOpen(false);
      showSuccess(`Score Cap successfully set to ${parsed}%.`);
    } catch (err: any) {
      showError(err.message || 'Failed to update score cap.');
    }
  };

  // --- PERSPECTIVE WEIGHTS MODAL STATE ---
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [financialWeight, setFinancialWeight] = useState('25');
  const [customerWeight, setCustomerWeight] = useState('25');
  const [internalWeight, setInternalWeight] = useState('25');
  const [learningWeight, setLearningWeight] = useState('25');

  const openWeightsModal = () => {
    const weights = (scoringConfigs.perspective_weights?.value as Record<string, number>) || {};
    setFinancialWeight(String(Math.round((weights.FINANCIAL ?? 0.25) * 100)));
    setCustomerWeight(String(Math.round((weights.CUSTOMER ?? 0.25) * 100)));
    setInternalWeight(String(Math.round((weights.INTERNAL_PROCESS ?? 0.25) * 100)));
    setLearningWeight(String(Math.round((weights.LEARNING_GROWTH ?? 0.25) * 100)));
    setIsWeightsModalOpen(true);
  };

  const totalWeightSum =
    (parseFloat(financialWeight) || 0) +
    (parseFloat(customerWeight) || 0) +
    (parseFloat(internalWeight) || 0) +
    (parseFloat(learningWeight) || 0);

  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.round(totalWeightSum) !== 100) {
      showError(`Perspective weights must add up to exactly 100% (currently ${totalWeightSum}%).`);
      return;
    }
    try {
      await updateScoringConfigMutation.mutateAsync({
        key: 'perspective_weights',
        value: {
          FINANCIAL: (parseFloat(financialWeight) || 0) / 100,
          CUSTOMER: (parseFloat(customerWeight) || 0) / 100,
          INTERNAL_PROCESS: (parseFloat(internalWeight) || 0) / 100,
          LEARNING_GROWTH: (parseFloat(learningWeight) || 0) / 100,
        },
        is_confirmed: true,
      });
      setIsWeightsModalOpen(false);
      showSuccess('BSC Perspective weights updated successfully.');
    } catch (err: any) {
      showError(err.message || 'Failed to update perspective weights.');
    }
  };

  // --- ACHIEVEMENT FORMULA MODAL STATE ---
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [formulaType, setFormulaType] = useState('actual_divided_by_plan');
  const [aggregationType, setAggregationType] = useState('weighted_average');

  const openFormulaModal = () => {
    setFormulaType(scoringConfigs.achievement_formula?.value || 'actual_divided_by_plan');
    setAggregationType(scoringConfigs.kpi_aggregation?.value || 'weighted_average');
    setIsFormulaModalOpen(true);
  };

  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all([
        updateScoringConfigMutation.mutateAsync({
          key: 'achievement_formula',
          value: { value: formulaType },
          is_confirmed: true,
        }),
        updateScoringConfigMutation.mutateAsync({
          key: 'kpi_aggregation',
          value: { value: aggregationType },
          is_confirmed: true,
        }),
      ]);
      setIsFormulaModalOpen(false);
      showSuccess('Calculation formula and aggregation method updated successfully.');
    } catch (err: any) {
      showError(err.message || 'Failed to update calculation formulas.');
    }
  };

  // --- RATING THRESHOLDS MODAL STATE ---
  const [isThresholdsModalOpen, setIsThresholdsModalOpen] = useState(false);
  const [editableThresholds, setEditableThresholds] = useState<RatingThreshold[]>([]);

  const openThresholdsModal = () => {
    setEditableThresholds(JSON.parse(JSON.stringify(thresholds)));
    setIsThresholdsModalOpen(true);
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateThresholdsMutation.mutateAsync(editableThresholds);
      setIsThresholdsModalOpen(false);
      showSuccess('Rating thresholds updated successfully.');
    } catch (err: any) {
      showError(err.message || 'Failed to update rating thresholds.');
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

  // Perspective weights display values
  const currentWeights = (scoringConfigs.perspective_weights?.value as Record<string, number>) || {
    FINANCIAL: 0.25,
    CUSTOMER: 0.25,
    INTERNAL_PROCESS: 0.25,
    LEARNING_GROWTH: 0.25,
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            System Configuration & KPI Rules
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Configure Balanced Scorecard templates, calculation formulas, scoring caps, weights, and rating thresholds.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fade-in">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:opacity-80">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center justify-between animate-fade-in">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:opacity-80">✕</button>
        </div>
      )}

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
          ⚙️ Scoring & Weighting Rules
        </button>
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeTab === 'thresholds'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          🎯 Rating Thresholds
        </button>
      </div>

      {/* TAB 1: KPI Definitions */}
      {activeTab === 'kpi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">
              Pre-defined KPI templates available for managers during manual entry and bulk uploads.
            </span>
            {isAdmin && (
              <Button size="sm" onClick={openAddKpiModal}>
                + Add KPI Template
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] text-xs uppercase font-bold text-[var(--muted)] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Perspective</th>
                  <th className="px-6 py-3.5">Objective</th>
                  <th className="px-6 py-3.5">Measurement</th>
                  <th className="px-6 py-3.5">Unit</th>
                  <th className="px-6 py-3.5">Default Weight</th>
                  <th className="px-6 py-3.5">Status</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loadingKpis ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted)]">
                      Loading KPI definitions...
                    </td>
                  </tr>
                ) : kpis.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted)]">
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
                        {k.description && (
                          <div className="text-xs text-[var(--muted)] font-normal mt-0.5">{k.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--muted)]">
                        {k.measurement}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium">
                        {k.unit}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium">
                        {k.weight ?? 1.0}x
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={k.is_active ? 'success' : 'danger'} size="sm">
                          {k.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditKpiModal(k)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleKpi(k.id)}
                          >
                            {k.is_active ? 'Disable' : 'Enable'}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Scoring Rules (Fully Editable) */}
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Score Cap Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--foreground)]">
                    Score Cap (Maximum KPI Score)
                  </h3>
                  <Badge variant="primary">Active Rule</Badge>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {scoringConfigs.score_cap?.description || 'Limits single KPI score achievement to protect overall score integrity.'}
                </p>
                <div className="text-3xl font-extrabold text-[var(--primary)] pt-2">
                  {scoringConfigs.score_cap?.value ?? 100}%
                </div>
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                  <Button size="sm" variant="outline" onClick={openScoreCapModal}>
                    ✏️ Configure Score Cap
                  </Button>
                </div>
              )}
            </div>

            {/* Achievement Formula Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--foreground)]">
                    Achievement Formula & Aggregation
                  </h3>
                  <Badge variant="primary">Formula Engine</Badge>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Formula and calculation strategy used to compute achievement percentage and weighted sums.
                </p>
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-mono font-bold text-[var(--primary)] bg-[var(--primary-light)]/40 px-3 py-2 rounded-xl inline-block">
                    Achievement % = (Actual / Plan) × 100
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Aggregation: <span className="font-semibold text-[var(--foreground)]">Weighted Average by Item Weight</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                  <Button size="sm" variant="outline" onClick={openFormulaModal}>
                    ✏️ Edit Formula & Rules
                  </Button>
                </div>
              )}
            </div>

            {/* Perspective Weights Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4 md:col-span-2 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[var(--foreground)]">
                      BSC Perspective Weights in Overall Score
                    </h3>
                    <Badge variant="success">Balanced Scorecard</Badge>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Weight percentage assigned to each Balanced Scorecard perspective when computing overall scores.
                  </p>
                </div>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={openWeightsModal}>
                    ✏️ Edit Perspective Weights
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    Financial
                  </div>
                  <div className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">
                    {Math.round((currentWeights.FINANCIAL ?? 0.25) * 100)}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 text-center">
                  <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                    Customer
                  </div>
                  <div className="text-2xl font-black text-cyan-900 dark:text-cyan-100 mt-1">
                    {Math.round((currentWeights.CUSTOMER ?? 0.25) * 100)}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Internal Process
                  </div>
                  <div className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">
                    {Math.round((currentWeights.INTERNAL_PROCESS ?? 0.25) * 100)}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Learning & Growth
                  </div>
                  <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                    {Math.round((currentWeights.LEARNING_GROWTH ?? 0.25) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Rating Thresholds */}
      {activeTab === 'thresholds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">
              Score brackets used to label achievement ratings (e.g. Excellent, Good, Satisfactory, Needs Improvement).
            </span>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={openThresholdsModal}>
                ✏️ Edit Rating Thresholds
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] text-xs uppercase font-bold text-[var(--muted)] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Rating Label</th>
                  <th className="px-6 py-3.5">Minimum Score</th>
                  <th className="px-6 py-3.5">Maximum Score</th>
                  <th className="px-6 py-3.5">Rating Status</th>
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
                        <Badge variant="success" size="sm">
                          Active
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

      {/* --- MODALS --- */}

      {/* 1. Create / Edit KPI Modal */}
      <Modal
        isOpen={isKpiModalOpen}
        onClose={() => setIsKpiModalOpen(false)}
        title={editingKpi ? 'Edit KPI Template' : 'Add Standard KPI Template'}
      >
        <form onSubmit={handleSaveKpi} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Default Weight"
              type="number"
              step="0.1"
              min="0.1"
              value={kpiWeight}
              onChange={(e) => setKpiWeight(e.target.value)}
              required
            />
            <Input
              label="Description / Context (Optional)"
              placeholder="Notes or operational guidance"
              value={kpiDescription}
              onChange={(e) => setKpiDescription(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsKpiModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createKpiMutation.isPending || updateKpiMutation.isPending}
            >
              {editingKpi ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Configure Score Cap Modal */}
      <Modal
        isOpen={isScoreCapModalOpen}
        onClose={() => setIsScoreCapModalOpen(false)}
        title="Configure Maximum KPI Score Cap"
      >
        <form onSubmit={handleSaveScoreCap} className="space-y-4">
          <p className="text-xs text-[var(--muted)]">
            Set the maximum score that an individual KPI can earn. If actual performance exceeds plan (e.g. 150%), the score will be capped at this threshold.
          </p>

          <Input
            label="Maximum Score Cap (%)"
            type="number"
            min="10"
            max="500"
            step="1"
            value={scoreCapValue}
            onChange={(e) => setScoreCapValue(e.target.value)}
            required
          />

          <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScoreCapModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={updateScoringConfigMutation.isPending}
            >
              Save Score Cap
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Configure Perspective Weights Modal */}
      <Modal
        isOpen={isWeightsModalOpen}
        onClose={() => setIsWeightsModalOpen(false)}
        title="Configure Balanced Scorecard Perspective Weights"
      >
        <form onSubmit={handleSaveWeights} className="space-y-4">
          <p className="text-xs text-[var(--muted)]">
            Assign the relative percentage weight for each Balanced Scorecard perspective. The sum must equal exactly 100%.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Financial (%)"
              type="number"
              min="0"
              max="100"
              value={financialWeight}
              onChange={(e) => setFinancialWeight(e.target.value)}
              required
            />
            <Input
              label="Customer (%)"
              type="number"
              min="0"
              max="100"
              value={customerWeight}
              onChange={(e) => setCustomerWeight(e.target.value)}
              required
            />
            <Input
              label="Internal Process (%)"
              type="number"
              min="0"
              max="100"
              value={internalWeight}
              onChange={(e) => setInternalWeight(e.target.value)}
              required
            />
            <Input
              label="Learning & Growth (%)"
              type="number"
              min="0"
              max="100"
              value={learningWeight}
              onChange={(e) => setLearningWeight(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-[var(--border)]">
            <span className="text-xs font-semibold">Total Allocated:</span>
            <span
              className={`text-sm font-bold font-mono ${
                Math.round(totalWeightSum) === 100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalWeightSum}% {Math.round(totalWeightSum) === 100 ? '✓ (Valid)' : '⚠️ (Must be 100%)'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => {
                setFinancialWeight('25');
                setCustomerWeight('25');
                setInternalWeight('25');
                setLearningWeight('25');
              }}
              className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer"
            >
              Reset to Equal (25% each)
            </button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWeightsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={Math.round(totalWeightSum) !== 100}
                isLoading={updateScoringConfigMutation.isPending}
              >
                Save Weights
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 4. Configure Formula & Aggregation Modal */}
      <Modal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        title="Configure Calculation Formula & Rules"
      >
        <form onSubmit={handleSaveFormula} className="space-y-4">
          <Select
            label="Achievement Percentage Formula"
            value={formulaType}
            onChange={(e) => setFormulaType(e.target.value)}
            options={[
              {
                value: 'actual_divided_by_plan',
                label: 'Standard: Achievement % = (Actual / Plan) × 100',
              },
              {
                value: 'inverse_plan_divided_by_actual',
                label: 'Inverse / Cost-reduction: Achievement % = (Plan / Actual) × 100',
              },
              {
                value: 'target_variance',
                label: 'Variance: Achievement % = 100 + ((Actual - Plan) / Plan) × 100',
              },
            ]}
          />

          <Select
            label="KPI Aggregation Within Perspective"
            value={aggregationType}
            onChange={(e) => setAggregationType(e.target.value)}
            options={[
              {
                value: 'weighted_average',
                label: 'Weighted Average (Weighted by each KPI Item Weight)',
              },
              {
                value: 'simple_average',
                label: 'Simple Arithmetic Average (Equal weight per KPI)',
              },
            ]}
          />

          <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormulaModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={updateScoringConfigMutation.isPending}
            >
              Save Calculation Rules
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Configure Rating Thresholds Modal */}
      <Modal
        isOpen={isThresholdsModalOpen}
        onClose={() => setIsThresholdsModalOpen(false)}
        title="Edit Rating Threshold Brackets"
      >
        <form onSubmit={handleSaveThresholds} className="space-y-4">
          <p className="text-xs text-[var(--muted)]">
            Configure score intervals (percentages) for each performance rating tier.
          </p>

          <div className="space-y-3">
            {editableThresholds.map((t, idx) => (
              <div
                key={t.id || idx}
                className="p-3 rounded-xl border border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <div className="font-semibold text-xs text-[var(--foreground)]">{t.label}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Min Score (%)"
                    type="number"
                    step="0.01"
                    value={String(t.min_score)}
                    onChange={(e) => {
                      const copy = [...editableThresholds];
                      copy[idx].min_score = parseFloat(e.target.value) || 0;
                      setEditableThresholds(copy);
                    }}
                    required
                  />
                  <Input
                    label="Max Score (%)"
                    type="number"
                    step="0.01"
                    value={String(t.max_score)}
                    onChange={(e) => {
                      const copy = [...editableThresholds];
                      copy[idx].max_score = parseFloat(e.target.value) || 0;
                      setEditableThresholds(copy);
                    }}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsThresholdsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={updateThresholdsMutation.isPending}
            >
              Save Rating Thresholds
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
