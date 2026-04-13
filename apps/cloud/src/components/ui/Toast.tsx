'use client';

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
}

export function Toast({ message, variant = 'info', onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[var(--success)]" />,
    error: <AlertCircle className="w-5 h-5 text-[var(--error)]" />,
    warning: <AlertCircle className="w-5 h-5 text-[var(--warning)]" />,
    info: <Info className="w-5 h-5 text-[var(--info)]" />,
  };

  const styles = {
    success: 'bg-[var(--success)]/10 border-[var(--success)]/40 text-[var(--success)]',
    error: 'bg-[var(--error)]/10 border-[var(--error)]/40 text-[var(--error)]',
    warning: 'bg-[var(--warning)]/10 border-[var(--warning)]/40 text-[var(--warning)]',
    info: 'bg-[var(--info)]/10 border-[var(--info)]/40 text-[var(--info)]',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-[var(--radius-md)] border backdrop-blur-md shadow-lg',
        'animate-fadeInUp',
        styles[variant]
      )}
    >
      {icons[variant]}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  // This would be connected to the ToastProvider
  return null;
}
