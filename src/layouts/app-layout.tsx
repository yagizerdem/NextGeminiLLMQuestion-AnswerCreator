"use client";

import { isLanguage, useLocalization } from "@/providers/localization-provider";
import { Brain, ChevronDown, Globe, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const languages = [
  { code: "en", label: "english" },
  { code: "tr", label: "turkish" },
  { code: "nl", label: "dutch" },
  { code: "ru", label: "russian" },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useLocalization();
  const { user, setUser } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Sign out failed with status ${response.status}`);
      }
      setUser(null);
      toast.success(t("signedOut"));
    } catch (error) {
      console.error("Failed to sign out", error);
      toast.error(t("signOutFailed"));
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
              <span>{t("brandName")}</span>
            </Link>
            {user && (
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-700 dark:text-violet-300">
                  {t("workspace")}
                </span>
                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-700 dark:text-sky-300">
                  {t("aiPowered")}
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                  {t("readyToCreate")}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default h-9 gap-2 rounded-full pr-3 pl-1"
                    aria-label={t("accountMenu", { username: user.username })}
                    disabled={isSigningOut}
                  >
                    <Avatar size="sm" aria-hidden="true">
                      <AvatarFallback className="bg-violet-500/15 font-semibold text-violet-700 dark:text-violet-300">
                        {Array.from(user.username.trim())[0]?.toUpperCase() || (
                          <UserRound className="size-3.5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate sm:block">
                      {user.username}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className="size-3.5 text-muted-foreground"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="wrap-anywhere">
                    {user.username}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserRound aria-hidden="true" className="size-4" />
                      {t("profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isSigningOut}
                    onSelect={() => void signOut()}
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Select
              value={language}
              onValueChange={(value) => {
                if (isLanguage(value)) setLanguage(value);
              }}
            >
              <SelectTrigger
                aria-label={t("language")}
                className="gap-2 rounded-full border-violet-500/20 bg-background px-3 font-medium hover:border-violet-500/40 hover:bg-violet-500/5 data-[size=default]:h-9 dark:bg-background"
              >
                <Globe
                  aria-hidden="true"
                  className="size-4 text-violet-700 dark:text-violet-300"
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                align="end"
                sideOffset={8}
                avoidCollisions={false}
                className="min-w-36 rounded-xl border border-violet-500/15 p-1 shadow-lg ring-0 data-[side=bottom]:translate-y-0 *:data-[position=popper]:h-auto *:data-[position=popper]:min-w-0"
              >
                {languages.map(({ code, label }) => (
                  <SelectItem
                    key={code}
                    value={code}
                    className="rounded-lg py-2 pl-2.5 data-[state=checked]:font-semibold focus:bg-violet-500/10 focus:text-violet-700 dark:focus:text-violet-300"
                  >
                    {t(label)}
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
            <span>{t("brandName")}</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            {t("createThoughtfulQuestions")}
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("brandName")}
          </p>
        </div>
      </footer>
      <Toaster
        duration={5000}
        position="top-right"
        containerAriaLabel={t("notifications")}
      />
    </div>
  );
}
