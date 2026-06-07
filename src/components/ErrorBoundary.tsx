import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error in Resonance/Atlas component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded text-sm">
          <p className="font-semibold text-destructive">Something went wrong loading this section.</p>
          <p className="text-muted-foreground mt-1">The Resonance Spheres feature encountered an error. The rest of the page should still work. Check console for details.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-xs underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;