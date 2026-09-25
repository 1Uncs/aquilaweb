import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Aquila Station Crash Caught by ErrorBoundary]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070C09] text-[#F1F7F3] flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-[#0E1712] border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Situation Room Session Interrupted
              </h2>
              <p className="text-xs text-[#718579]">
                An unexpected execution error occurred while processing electoral telemetry.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#070C09] border border-[#1C2E24] rounded-xl text-left font-mono text-[11px] text-red-300 overflow-x-auto max-h-32">
                {this.state.error.message || 'Unknown runtime anomaly'}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0D6338] to-[#10B981] hover:from-[#15803D] hover:to-[#34D399] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Station Session</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
