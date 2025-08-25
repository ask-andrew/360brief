"use client";

import Script from 'next/script';

export function ThemeScript() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/theme-change@2.2.0/theme-change.min.js"
      strategy="beforeInteractive"
    />
  );
}
