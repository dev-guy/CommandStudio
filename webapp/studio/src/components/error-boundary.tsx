import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unhandled UI error", error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 p-6 sm:p-10">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
              Application Error
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
              Something went wrong.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The app hit an unexpected error. You can reload the page to try again.
            </p>
            {this.state.error?.message ? (
              <pre className="mt-5 overflow-x-auto rounded-lg bg-slate-950/95 p-4 text-xs text-slate-100">
                {this.state.error.message}
              </pre>
            ) : null}
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
