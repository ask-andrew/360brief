"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </>
  );
}
