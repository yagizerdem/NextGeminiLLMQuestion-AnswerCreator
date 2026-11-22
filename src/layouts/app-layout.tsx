"use client";

import { Brain } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/providers/auth-provider";

const languages = ["TR", "EN"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="border-b border-border bg-background bg-linear-to-r from-violet-500/10 via-transparent to-sky-500/10 text-foreground">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Brain
              aria-hidden="true"
              className="size-6 text-violet-700 dark:text-violet-300"
            />
            <span>Gemini Q&amp;A</span>
          </Link>
          <Select defaultValue="EN">
            <SelectTrigger aria-label="Language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-border bg-background bg-linear-to-r from-violet-500/10 via-sky-500/5 to-emerald-500/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 font-semibold text-foreground"
          >
            <Brain
              aria-hidden="true"
              className="size-5 text-violet-700 dark:text-violet-300"
            />
            <span>Gemini Q&amp;A</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Create thoughtful questions. Find clearer answers.
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Gemini Q&amp;A
          </p>
        </div>
      </footer>
      <Toaster duration={5000} position="top-right" />
    </div>
  );
}
