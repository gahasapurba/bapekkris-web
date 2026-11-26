import React, { type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  /** Navigates back to a safe tab; without it the page reloads at the site root. */
  onResetTab?: () => void;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error in tab:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onResetTab) {
      this.props.onResetTab();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="mx-auto my-14 flex w-full max-w-[700px] flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-danger-tint text-danger"><AlertCircle size={32} aria-hidden="true" /></span>
          <h2 className="font-display text-[1.4rem] font-semibold text-ink">Terjadi kendala memuat halaman</h2>
          <p className="max-w-[480px] text-[0.92rem] leading-relaxed text-muted">Muat ulang halaman atau kembali ke beranda. Jika kendala berulang, beri tahu pengurus beserta pesan di bawah.</p>
          {this.state.error && (
            <pre className="m-0 max-h-44 w-full max-w-[560px] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-danger-line bg-danger-tint px-4 py-3 text-left font-mono text-[0.8rem] text-ink">
              {this.state.error.toString()}
            </pre>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button variant="gold" icon={<RotateCcw size={15} aria-hidden="true" />} onClick={this.handleReload}>Muat ulang halaman</Button>
            <Button variant="secondary" icon={<Home size={15} aria-hidden="true" />} onClick={this.handleGoHome}>Kembali ke beranda</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

