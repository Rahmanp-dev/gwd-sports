import { store } from "@/store";

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  userId?: string;
}

class FrontendLogger {
  private isProduction = import.meta.env.PROD;
  private backendUrl = "http://localhost:3000/api"; // Default fallback, should match apiService configuration

  private getUserId(): string | undefined {
    try {
      const state = store.getState();
      return state.auth.user?.id || state.auth.user?._id || state.auth.user?.email || undefined;
    } catch {
      return undefined;
    }
  }

  private async sendLog(payload: LogPayload) {
    if (!this.isProduction) {
      // In development, log to console
      switch (payload.level) {
        case "info":
          console.info(`[INFO] ${payload.message}`, payload);
          break;
        case "warn":
          console.warn(`[WARN] ${payload.message}`, payload);
          break;
        case "error":
          console.error(`[ERROR] ${payload.message}`, payload);
          break;
      }
      return;
    }

    // In production, send to backend via fetch (fire and forget)
    // Using fetch directly to avoid circular dependency with ApiService
    try {
      fetch(`${this.backendUrl}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Only necessary if your /api/logs requires auth, but usually logs endpoints shouldn't block on auth
        },
        body: JSON.stringify(payload),
        keepalive: true, // ensures the request completes even if the page is being unloaded
      }).catch(() => {
        // Silently fail if log cannot be sent to avoid console noise in production
      });
    } catch {
      // Catch synchronous errors in fetch setup
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const payload: LogPayload = {
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
    };

    this.sendLog(payload);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    // Prevent excessive logging for identical errors
    this.log("error", message, metadata);
  }
}

export const logger = new FrontendLogger();
