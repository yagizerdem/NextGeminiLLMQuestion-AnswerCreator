"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth-provider";
import { LocalizationProvider } from "@/providers/localization-provider";

export function BaseProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <LocalizationProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </LocalizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
