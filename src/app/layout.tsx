import React from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./Providers";
import AnalyticsProvider from "@/components/providers/AnalyticsProvider";

export const metadata = {
  title: "GWD Sports Ecosystem",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Bebas Neue is the condensed poster face used only by the program
            showcase pages (components/shared/ProgramsSection). Everything else
            is DM Sans, loaded from globals.css. Inter and Clash Display were
            dropped: Inter had a single use that DM Sans covers, and Clash
            Display was fetched on every page load — twice, from here and from
            globals.css — for one <h2>. */}
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <AnalyticsProvider />
        <Providers>
          {children}
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
        </Providers>
      </body>
    </html>
  );
}
