import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg border bg-[var(--card)] px-3.5 py-2.5 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-75 ${
              leftIcon ? 'pl-10' : ''
            } ${
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20'
                : 'border-[var(--border)]'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[var(--danger)] font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-[var(--muted)]">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
