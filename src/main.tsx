import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
            <h1 className="text-xl font-semibold text-gray-900">The journal could not load</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Refresh the preview once more. If the problem continues, the details below identify the issue.
            </p>
            <pre className="mt-4 overflow-auto rounded-lg bg-gray-100 p-3 text-xs text-red-700 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
