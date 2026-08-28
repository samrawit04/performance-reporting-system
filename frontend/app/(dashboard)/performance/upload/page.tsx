'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import {
  ParsedPerformanceData,
  PeriodType,
} from '../../../../lib/types';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Badge } from '../../../../components/ui/Badge';

export default function ExcelUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [periodLabel, setPeriodLabel] = useState('Monthly — 2026-08');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ParsedPerformanceData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = api.getToken();
      const res = await fetch('http://localhost:3001/api/uploads/excel', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message ||
            (errJson.errors && errJson.errors.join('; ')) ||
            'Failed to parse Excel file',
        );
      }

      const result = await res.json();
      setUploadedFileId(result.fileId);
      setPreviewData(result.preview);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse file');
      setPreviewData(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmSubmission = async () => {
    if (!previewData || previewData.entries.length === 0) return;

    setIsSaving(true);
    setError(null);
    try {
      const submission = await api.post<any>('/submissions', {
        period_type: periodType,
        period_label: periodLabel,
        source_file_id: uploadedFileId || undefined,
        entries: previewData.entries.map((e) => ({
          perspective: e.perspective,
          objective: e.objective,
          measurement: e.measurement,
          unit: e.unit,
          plan_value: e.plan_value,
          actual_value: e.actual_value,
          notes: e.notes || undefined,
        })),
      });

      // Submit and calculate automatically
      await api.post(`/submissions/${submission.id}/submit`);

      router.push(`/performance/${submission.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save submission.');
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
          Upload Excel Performance Report
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          Upload the management Excel spreadsheet (Perspective, Objective, Measurement, Unit, Plan, Actual, Notes).
        </p>
      </div>

      {/* Metadata Form */}
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

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[var(--primary)] bg-[var(--primary-light)]/20'
            : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileChange(e.target.files[0]);
            }
          }}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-3xl flex items-center justify-center mx-auto shadow-inner">
            📥
          </div>

          <div className="font-bold text-sm text-[var(--foreground)]">
            {file ? file.name : 'Click to select or drag & drop Excel workbook'}
          </div>

          <p className="text-xs text-[var(--muted)]">
            Supports Microsoft Excel (.xlsx, .xls) matching the 7-column template:
            <br />
            <span className="font-mono text-[11px] text-[var(--primary)]">
              Perspective • Objective • Measurement • Unit • Plan • Actual • Notes
            </span>
          </p>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--primary)] font-semibold pt-2">
              <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <span>Extracting and validating rows...</span>
            </div>
          )}
        </div>
      </div>

      {/* Parsed Preview Table */}
      {previewData && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-[var(--foreground)]">
                Extracted Performance Preview
              </h2>
              <Badge variant="success">{previewData.validRows} Valid KPIs</Badge>
            </div>

            <Button
              onClick={handleConfirmSubmission}
              isLoading={isSaving}
              size="md"
            >
              Confirm & Calculate Scores →
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-[var(--border)] uppercase font-bold text-[var(--muted)] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Perspective</th>
                  <th className="px-4 py-3">Strategic Objective</th>
                  <th className="px-4 py-3">Measurement</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Actual</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {previewData.entries.map((entry, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                      <Badge variant="primary" size="sm">
                        {entry.perspective}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                      {entry.objective}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {entry.measurement}
                    </td>
                    <td className="px-4 py-3 font-mono">{entry.unit}</td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {entry.plan_value}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {entry.actual_value}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {entry.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
