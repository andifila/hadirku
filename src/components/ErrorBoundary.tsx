"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
            Terjadi kesalahan
          </p>
          <p className="text-xs" style={{ color: "#dc2626", opacity: 0.7, fontFamily: "var(--font-inter)" }}>
            {this.state.error?.message ?? "Coba muat ulang halaman."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 rounded-xl px-4 py-2 text-xs font-medium"
            style={{ background: "#fecaca", color: "#dc2626", fontFamily: "var(--font-inter)" }}
          >
            Coba lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
