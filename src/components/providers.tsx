"use client";

import { AuthProvider } from "@/context/auth-context";
import { ProblemProvider } from "@/context/problem-context";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
        <ProblemProvider>
            {children}
            <Toaster />
        </ProblemProvider>
    </AuthProvider>
  );
}
