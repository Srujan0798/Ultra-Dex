import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'accent';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default:
        'bg-[var(--primary-700)]/50 text-[var(--text-secondary)] border-[var(--secondary-500)]/30',
      success: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/40',
      error: 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/40',
      warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/40',
      info: 'bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/40',
      accent:
        'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/40',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
