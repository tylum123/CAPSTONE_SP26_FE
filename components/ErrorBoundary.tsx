"use client";

import React from "react";

type Props = { children: React.ReactNode };

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<Props>,
  { error: Error | null }
> {
  constructor(props: React.PropsWithChildren<Props>) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log the error to an error reporting service here
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold text-destructive">
            Có lỗi khi hiển thị phần này
          </h2>
          <pre className="whitespace-pre-wrap mt-2 text-sm text-muted-foreground">
            {String(this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
