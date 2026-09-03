'use client';

import React, { useState } from 'react';

export interface TrendDataPoint {
  id?: string;
  label: string;
  overallScore: number;
  rating?: string;
  status?: string;
  date?: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  height?: number;
  className?: string;
}

export function TrendChart({ data, height = 220, className = '' }: TrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)] ${className}`}
        style={{ height }}
      >
        <span className="text-2xl mb-1">📈</span>
        <p className="font-medium">No historical performance records yet.</p>
        <p className="text-xs text-[var(--muted)]">Evaluated periods will populate this trend graph.</p>
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 40 };
  const width = 500; // viewBox virtual width for responsive svg
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minScore = 0;
  const maxScore = 100;

  const getX = (index: number) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minScore, Math.min(val, maxScore));
    return padding.top + chartHeight - (clamped / 100) * chartHeight;
  };

  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.overallScore), raw: d }));

  const pathD = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    // Bezier control points for smooth line
    const prev = arr[i - 1];
    const cpX1 = prev.x + (curr.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (curr.x - prev.x) / 2;
    const cpY2 = curr.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className={`w-full select-none ${className}`}>
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0077b6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0077b6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis ticks */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={`ytick-${tick}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 || tick === 100 ? 'none' : '3,3'}
                  opacity={tick === 0 || tick === 100 ? '0.6' : '0.35'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize="9"
                  fontWeight="600"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Target 80% Benchmark Reference Line */}
          <line
            x1={padding.left}
            y1={getY(80)}
            x2={width - padding.right}
            y2={getY(80)}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.6"
          />
          <text
            x={width - padding.right}
            y={getY(80) - 4}
            textAnchor="end"
            fill="#10b981"
            fontSize="8"
            fontWeight="bold"
          >
            Target (80%)
          </text>

          {/* Area fill */}
          <path d={areaD} fill="url(#trendGradient)" />

          {/* Curved trend line */}
          <path
            d={pathD}
            fill="none"
            stroke="#0077b6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={`trend-point-${i}`}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={padding.top}
                    x2={p.x}
                    y2={padding.top + chartHeight}
                    stroke="#0077b6"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    opacity="0.8"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 8 : 5}
                  fill="#ffffff"
                  stroke="#0077b6"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Score value above point */}
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {p.raw.overallScore.toFixed(1)}%
                </text>

                {/* X Axis period label */}
                <text
                  x={p.x}
                  y={padding.top + chartHeight + 18}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="10"
                  fontWeight="600"
                >
                  {p.raw.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover details tooltip banner */}
        {hoveredIdx !== null && (
          <div className="absolute top-1 right-2 bg-slate-900/90 text-white text-xs px-3 py-1 rounded-lg border border-slate-700 shadow-md flex items-center gap-2 pointer-events-none">
            <span className="font-semibold">{data[hoveredIdx].label}:</span>
            <span className="font-bold text-sky-300">
              {data[hoveredIdx].overallScore.toFixed(1)}%
            </span>
            {data[hoveredIdx].rating && (
              <span className="px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-200 text-[10px] uppercase font-bold">
                {data[hoveredIdx].rating}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
