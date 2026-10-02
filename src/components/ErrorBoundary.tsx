'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-red/20 text-accent-red flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-display">
            Something went wrong
          </h2>
          <p className="text-sm text-text-muted max-w-md mb-6">
            We encountered an unexpected error while rendering this media view. Our ad shield and fallback services remain operational.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-glow"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-light border border-surface-border text-white text-xs font-semibold transition-all"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
