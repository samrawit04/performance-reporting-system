'use client';

import React, { useState } from 'react';

export interface RadarDataPoint {
  perspective: string;
  label: string;
  score: number; // 0 to 100
  rating?: string;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
}

export function RadarChart({ data, size = 340, className = '' }: RadarChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<RadarDataPoint | null>(null);

  const center = size / 2;
  const radius = (size / 2) - 48; // padding for labels
  const totalAxes = 4;

  // Angles in radians for the 4 perspectives (North, East, South, West)
  const angles = [
    -Math.PI / 2, // 0: Top (Financial)
    0,            // 1: Right (Customer)
    Math.PI / 2,  // 2: Bottom (Internal Process)
    Math.PI,      // 3: Left (Learning & Growth)
  ];

  const getCoordinates = (angle: number, value: number) => {
    const distance = (Math.max(0, Math.min(value, 100)) / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // Generate web rings (25%, 50%, 75%, 100%)
  const rings = [25, 50, 75, 100];

  // Data polygon points
  const points = data.map((d, index) => {
    const angle = angles[index % totalAxes];
    return getCoordinates(angle, d.score);
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            {/* Gradient for the BSC Radar area */}
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.45)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0.25)" />
            </linearGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Web grid concentric rings */}
          {rings.map((ringValue) => {
            const ringPoints = angles.map((angle) => getCoordinates(angle, ringValue));
            const ringPath =
              ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';
            return (
              <g key={`ring-${ringValue}`}>
                <path
                  d={ringPath}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={ringValue === 100 ? '1.5' : '1'}
                  strokeDasharray={ringValue === 100 ? 'none' : '3,3'}
                  opacity={ringValue === 100 ? '0.7' : '0.4'}
                />
                {/* Ring percentage label */}
                <text
                  x={center + 6}
                  y={center - (ringValue / 100) * radius + 4}
                  fill="var(--muted)"
                  fontSize="9"
                  fontWeight="600"
                  opacity="0.8"
                >
                  {ringValue}%
                </text>
              </g>
            );
          })}

          {/* Axis Spokes from center to 100% outer edge */}
          {angles.map((angle, i) => {
            const end = getCoordinates(angle, 100);
            return (
              <line
                key={`spoke-${i}`}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}

          {/* Data Polygon */}
          <path
            d={polygonPath}
            fill="url(#radarGradient)"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#radarGlow)"
            className="transition-all duration-500 ease-out"
          />

          {/* Data point markers and labels */}
          {data.map((d, index) => {
            const angle = angles[index % totalAxes];
            const coord = points[index];
            const isHovered = hoveredPoint?.perspective === d.perspective;

            // Compute label positioning outside the 100% ring
            const labelDist = radius + 22;
            const labelX = center + labelDist * Math.cos(angle);
            const labelY = center + labelDist * Math.sin(angle);

            // Alignment helper based on angle
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            let dy = '0.3em';
            if (angle === -Math.PI / 2) {
              // Top
              dy = '-0.5em';
            } else if (angle === Math.PI / 2) {
              // Bottom
              dy = '1.2em';
            } else if (angle === 0) {
              // Right
              textAnchor = 'start';
            } else {
              // Left
              textAnchor = 'end';
            }

            return (
              <g key={`data-${d.perspective}`}>
                {/* Vertex Circle marker */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isHovered ? 7 : 5}
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Perspective Axis Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  dy={dy}
                  fill="var(--foreground)"
                  fontSize="11"
                  fontWeight="700"
                  className="cursor-default"
                >
                  {d.label}
                </text>
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  dy={angle === -Math.PI / 2 ? '0.7em' : angle === Math.PI / 2 ? '2.4em' : '1.5em'}
                  fill="#6366f1"
                  fontSize="10"
                  fontWeight="800"
                >
                  {d.score.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 pointer-events-none transition-all z-20 flex items-center gap-2"
          >
            <span className="font-bold">{hoveredPoint.label}:</span>
            <span className="text-indigo-300 font-semibold">{hoveredPoint.score.toFixed(1)}%</span>
            {hoveredPoint.rating && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                {hoveredPoint.rating}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend summary pills */}
      <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-xs">
        {data.map((d) => (
          <div
            key={d.perspective}
            className="flex items-center justify-between p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs shadow-2xs"
          >
            <span className="text-[var(--muted)] font-medium truncate pr-1">{d.label}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {d.score.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
