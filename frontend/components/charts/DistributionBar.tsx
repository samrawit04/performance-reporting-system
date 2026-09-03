'use client';

import React from 'react';

export interface DistributionItem {
  label: string;
  value: number;
  total?: number;
  color?: string;
  badge?: string;
}

interface DistributionBarProps {
  items: DistributionItem[];
  className?: string;
}

export function DistributionBar({ items, className = '' }: DistributionBarProps) {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {items.map((item, i) => {
        const total = item.total || 100;
        const pct = Math.min(100, Math.max(0, (item.value / total) * 100));
        const color = item.color || '#0077b6';

        return (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-[var(--foreground)] flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted)] font-medium">
                  {item.value.toFixed(1)} / {total}
                </span>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--foreground)]">
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
