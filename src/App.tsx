import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShadowXLabControlPlane } from './pages/ShadowXLabControlPlane';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Cyber-Platform UI:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080A0E] text-slate-200 flex items-center justify-center p-6 font-mono text-xs">
          <div className="max-w-lg w-full bg-[#0B0E14] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-base font-bold text-white">Application Exception Caught</h2>
            </div>
            <p className="text-slate-300">
              The portal encountered a render error but recovered safely.
            </p>
            <pre className="p-3 bg-[#080A0E] rounded-xl border border-[#202736] text-amber-300 text-[11px] whitespace-pre-wrap break-all">
              {this.state.error?.message || "Unknown rendering exception"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Web Console</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ShadowXLabControlPlane />
    </ErrorBoundary>
  );
};
