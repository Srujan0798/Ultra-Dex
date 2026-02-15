import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected dashboard error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    try {
      console.error('[dashboard:error-boundary]', error, errorInfo);
    } catch {
      // no-op
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <section className="w-full max-w-xl rounded-2xl border border-rose-500/30 bg-slate-900/80 p-6">
          <h1 className="text-xl font-semibold text-rose-300">
            {this.props.fallbackTitle || 'Dashboard Rendering Error'}
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            The dashboard crashed while rendering. Retry once; if this repeats, inspect browser console
            and recent changes.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            {this.state.message || 'No error message available'}
          </pre>
          <button
            type="button"
            className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            onClick={this.handleRetry}
          >
            Retry Render
          </button>
        </section>
      </main>
    );
  }
}
