"use client";
import * as React from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Minimal passthrough provider; props are accepted for compatibility
  return <>{children}</>;
}
