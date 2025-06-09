import React from 'react';

interface ErrorDetails {
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  url?: string;
  userAgent?: string;
  timestamp: number;
  userId?: string;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errorLog: ErrorDetails[] = [];
  private readonly MAX_ERRORS = 100;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack || null,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        });
      });

      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.message,
          stack: event.error?.stack || null,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        });
      });
    }
  }

  public trackError(error: ErrorDetails): void {
    this.errorLog.push(error);

    if (this.errorLog.length > this.MAX_ERRORS) {
      this.errorLog = this.errorLog.slice(-this.MAX_ERRORS);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', error);
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error);
    }
  }

  private async sendToErrorService(error: ErrorDetails): Promise<void> {
    try {
      console.error('Error in production:', error);
    } catch (e) {
      console.error('Failed to send error to tracking service:', e);
    }
  }

  public getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }
}

export const errorTracker = ErrorTracker.getInstance();

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    errorTracker.trackError({
      message: error.message,
      stack: error.stack || null,
      componentStack: errorInfo.componentStack || null,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: Date.now(),
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 