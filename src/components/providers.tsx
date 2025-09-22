
"use client";
import * as React from "react";
import { AuthProvider } from "@/context/auth-context";
import { ProblemProvider } from "@/context/problem-context";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from 'next-intl';

export function Providers({ children, locale, messages }: { children: React.ReactNode, locale: string, messages: any }) {

  return (
       <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
                <ProblemProvider>
                    {children}
                    <Toaster />
                </ProblemProvider>
            </AuthProvider>
          </NextIntlClientProvider>
      </ThemeProvider>
  );
}
