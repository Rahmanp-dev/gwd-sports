import { store } from "@/store";
import { API_BASE_URL } from "@/utils/constants";

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  userId?: string;
}

class FrontendLogger {
  private isProduction = (process.env.NODE_ENV === "production");
  private backendUrl = API_BASE_URL;

  private getUserId(): string | undefined {
    try {
      const state = store.getState();
      return (
        (state.auth.user as any)?.id ||
        state.auth.user?._id ||
        state.auth.user?.email ||
        undefined
      );
    } catch {
      return undefined;
    }
  }

  /**
   * Folds the useful parts of `metadata` into the message itself.
   *
   * WHY. This used to log `console.error("[ERROR] " + message, payload)`, and
   * Next's dev overlay renders that wrapper object as `{}` — so a failed import
   * surfaced as `[ERROR] API Request Failed {}` with the status code, endpoint
   * and server message all present in the payload but invisible. A log line that
   * hides the one fact you opened it for is worse than no log line.
   *
   * Only scalars are inlined; anything structural stays in the object argument
   * for devtools to expand.
   */
  private summarise(metadata?: Record<string, any>): string {
    if (!metadata) return "";
    const parts = Object.entries(metadata)
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== "" &&
          (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"),
      )
      .map(([key, value]) => `${key}=${value}`);
    return parts.length ? ` — ${parts.join(" ")}` : "";
  }

  private async sendLog(payload: LogPayload) {
    if (!this.isProduction) {
      // In development, log to console. The metadata is summarised into the
      // message so it survives whatever the dev overlay does to the object.
      const line = `[${payload.level.toUpperCase()}] ${payload.message}${this.summarise(payload.metadata)}`;
      switch (payload.level) {
        case "info":
          console.info(line, payload.metadata ?? {});
          break;
        case "warn":
          console.warn(line, payload.metadata ?? {});
          break;
        case "error":
          console.error(line, payload.metadata ?? {});
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

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ) {
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
