import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1, ...props }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gradient-to-r from-[var(--primary-700)]/50 to-[var(--primary-600)]/50',
            'rounded-[var(--radius-md)]',
            'animate-pulse',
            className
          )}
          {...props}
        />
      ))}
    </>
  );
};
