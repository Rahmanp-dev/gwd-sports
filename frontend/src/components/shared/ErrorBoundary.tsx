import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our custom logger
    logger.error("React Error Boundary Caught", {
      errorMessage: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
          <h1 className="text-4xl font-bold text-red-500 mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl text-center">
            {this.state.error?.message ||
              "An unexpected error occurred while rendering the page."}
          </p>
          <div className="flex gap-4">
            <Button
              onClick={this.handleReload}
              className="bg-green-600 hover:bg-green-700"
            >
              Reload Page
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
