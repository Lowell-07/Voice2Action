
"use client";
import * as React from "react";
import { AuthProvider } from "@/context/auth-context";
import { ProblemProvider } from "@/context/problem-context";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';

export function Providers({ children, locale, messages }: { children: React.ReactNode, locale: string, messages: AbstractIntlMessages }) {

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
       <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
              <ProblemProvider>
                  {children}
                  <Toaster />
              </ProblemProvider>
          </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
