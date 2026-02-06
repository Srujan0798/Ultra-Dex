import * as React from 'react';

export function Button({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded bg-indigo-500 px-4 py-2 font-semibold text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
