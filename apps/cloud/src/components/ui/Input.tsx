import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full h-[var(--input-height)] px-4 py-2.5',
              'bg-[var(--primary-700)]/30 border border-[var(--secondary-500)]/30',
              'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'rounded-[var(--radius-sm)] font-[var(--font-body)]',
              'transition-all duration-[var(--duration-base)]',
              'focus:outline-none focus:border-[var(--accent-primary)]/60 focus:shadow-glow-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon && 'pl-10',
              error &&
                'border-[var(--error)]/60 focus:border-[var(--error)] focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[var(--error)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
