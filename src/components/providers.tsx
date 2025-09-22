
"use client";
import * as React from "react";
import { AuthProvider } from "@/context/auth-context";
import { ProblemProvider } from "@/context/problem-context";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from 'next-intl';

// In a real app, you'd want to fetch the messages for the current locale.
// For this example, we'll just use a mock.
async function getMockMessages(locale: string) {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    // Fallback to English if the locale is not found
    return (await import(`@/messages/en.json`)).default;
  }
}

export function Providers({ children, locale }: { children: React.ReactNode, locale: string }) {
  // In a real app, you would use `use(getMessages())` here and make this an async component
  const [messages, setMessages] = React.useState({});
  React.useEffect(() => {
    getMockMessages(locale).then(setMessages);
  }, [locale]);


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
