"use client";
import React from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { BrowserRouter, MemoryRouter } from "@/lib/router-shim";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

import { Suspense } from "react";

const Router = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === "undefined") {
    return <MemoryRouter><Suspense fallback={null}>{children}</Suspense></MemoryRouter>;
  }
  return <BrowserRouter><Suspense fallback={null}>{children}</Suspense></BrowserRouter>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Router>{children}</Router>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}
