"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./AuthProvider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </AuthProvider>
  );
}
