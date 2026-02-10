/**
 * @fileoverview Toaster module
 * @module ui/toaster
 */

'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

/**
 * Error handler for toaster
 * @param {Error} error - Error to handle
 */
function handleToasterError(error) {
  try {
    console.error('[toaster]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
