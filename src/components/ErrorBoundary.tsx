import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; label?: string; resetKey?: unknown; compact?: boolean };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label ?? "root"}]`, error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.compact) return null;
    return (
      <div role="alert" className="p-6 text-sm">
        <p className="font-display text-lg">Something went wrong in this room.</p>
        <p className="text-muted mt-1">{this.state.error.message}</p>
        <button type="button" className="mt-3 underline" onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}