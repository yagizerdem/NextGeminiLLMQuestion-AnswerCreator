"use client";

import { Brain } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import { toast } from "sonner";

const languages = ["TR", "EN"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Sign out failed with status ${response.status}`);
      }
      setUser(null);
      toast.success("Successfully signed out");
    } catch (error) {
      console.error("Failed to sign out", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="border-b border-border bg-background bg-linear-to-r from-violet-500/10 via-transparent to-sky-500/10 text-foreground">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Brain
                aria-hidden="true"
                className="size-6 text-violet-700 dark:text-violet-300"
              />
              <span>Gemini Q&amp;A</span>
            </Link>
            {user && (
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-700 dark:text-violet-300">
                  Your workspace
                </span>
                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-700 dark:text-sky-300">
                  AI powered
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                  Ready to create
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm font-medium">{user.username}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/profile")}
                >
                  Profile
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSigningOut}
                  onClick={signOut}
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </Button>
              </>
            )}
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
