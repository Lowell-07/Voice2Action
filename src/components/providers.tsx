
"use client";
import * as React from "react";
import { AuthProvider } from "@/context/auth-context";
import { ProblemProvider } from "@/context/problem-context";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {

  return (
       <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
              <ProblemProvider>
                  {children}
                  <Toaster />
              </ProblemProvider>
          </AuthProvider>
      </ThemeProvider>
  );
}
