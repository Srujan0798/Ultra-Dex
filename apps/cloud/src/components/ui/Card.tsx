import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[var(--primary-700)]/60 backdrop-blur-md',
          'border-2 border-white/[0.08]',
          'rounded-[var(--radius-md)] p-4',
          'shadow-md',
          'transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)]',
          elevated && 'bg-[var(--primary-600)]/80 border-white/[0.12] shadow-lg',
          interactive &&
            'hover:border-[var(--accent-primary)]/60 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
