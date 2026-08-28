import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]',
    success: 'bg-[var(--success-light)] text-[#065f46] border-[var(--success)]',
    warning: 'bg-[var(--warning-light)] text-[#92400e] border-[var(--warning)]',
    danger: 'bg-[var(--danger-light)] text-[#991b1b] border-[var(--danger)]',
    info: 'bg-[var(--info-light)] text-[#1e40af] border-[var(--info)]',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
}
