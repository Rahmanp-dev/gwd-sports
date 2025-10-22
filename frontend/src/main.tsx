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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
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
  </React.StrictMode>,
);
