import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import { Toaster } from "./components/ui/sonner";
import App from "./App";
import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { logger } from "./utils/logger";

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  logger.error("Global window.onerror intercepted", {
    message,
    source,
    lineno,
    colno,
    stack: error?.stack,
  });
  return false;
};

window.onunhandledrejection = (event) => {
  logger.error("Global unhandled promise rejection", {
    reason: event.reason,
    stack: event.reason?.stack,
  });
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  fontSize: "14px",
                  fontWeight: "500",
                },
                className: "toast-custom",
              }}
              theme="light"
              richColors
            />
          </Router>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
);
