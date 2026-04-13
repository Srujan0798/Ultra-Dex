import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, icon, children, ...props }, ref) => {
    const variants = {
      primary: `
        bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] 
        border border-[var(--accent-primary)]/40 
        hover:border-[var(--accent-primary)]/80 hover:shadow-glow-accent
        hover:scale-[1.02] active:scale-[0.98]
        focus-visible:ring-2 focus-visible:ring-offset-2 
        focus-visible:ring-offset-[var(--primary-800)] focus-visible:ring-[var(--accent-primary)]
      `,
      secondary: `
        bg-[var(--secondary-500)]/10 text-[var(--text-secondary)]
        border border-[var(--secondary-500)]/40
        hover:border-[var(--secondary-500)]/80 hover:text-[var(--text-primary)]
        hover:scale-[1.02] active:scale-[0.98]
      `,
      ghost: `
        text-[var(--text-secondary)] 
        hover:text-[var(--text-primary)] hover:bg-[var(--primary-700)]/30
        hover:scale-[1.02] active:scale-[0.98]
      `,
      danger: `
        bg-[var(--error)]/10 text-[var(--error)]
        border border-[var(--error)]/40
        hover:border-[var(--error)]/80 hover:shadow-glow
        hover:scale-[1.02] active:scale-[0.98]
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm h-[var(--button-height-sm)]',
      md: 'px-4 py-2.5 text-base h-[var(--button-height)]',
      lg: 'px-6 py-3 text-lg h-[var(--button-height-lg)]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-all duration-[var(--duration-base)] ease-[var(--ease-emphasized)]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          'rounded-[var(--radius-md)]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !isLoading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
