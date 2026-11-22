"use client";

import { useLocalization, type TranslationKey } from "@/providers/localization-provider";
import { getAuthErrorKey } from "@/lib/localize-auth-error";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEventEmitter } from "@/hooks/use-event-emitter";

interface SignUpOptions {
  username: string;
  email: string;
  password: string;
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLocalization();
  const contentRef = useRef<HTMLDivElement>(null);
  const [signUpOptions, setSignUpOptions] = useState<SignUpOptions>({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<TranslationKey[]>([]);
  const { publishEvent } = useEventEmitter<{ success: boolean }>(
    "signUpResult",
  );

  useLayoutEffect(() => {
    if (
      !contentRef.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const animation = gsap.from(contentRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: "power2.out",
    });

    return () => {
      animation.revert();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    try {
      event.preventDefault();
      setIsLoading(true);
      setErrors([]);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signUpOptions),
      });

      if (!response.ok) {
        const json: { message?: unknown; errors?: unknown } = await response.json();
        toast.error(t(getAuthErrorKey(json.message, "signUpFailed")));
        setErrors(Array.isArray(json.errors)
          ? json.errors.map((error) => getAuthErrorKey(error, "signUpFailed"))
          : []);
        return;
      }

      publishEvent({ success: true });
      onSuccess();
      toast.success(t("signedUp"));
    } catch (error) {
      console.error(error);
      toast.error(t("signUpFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div ref={contentRef}>
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-sky-500/20 text-violet-700 dark:text-violet-300">
        <UserPlus aria-hidden="true" className="size-5" />
      </div>
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">
          {t("createAccount")}
        </DialogTitle>
        <DialogDescription>
          {t("createAccountDescription")}
        </DialogDescription>
      </DialogHeader>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="signup-username" className="text-sm font-medium">
            {t("username")}
          </label>
          <Input
            id="signup-username"
            type="text"
            autoComplete="username"
            placeholder={t("chooseUsername")}
            required
            className="h-11"
            onChange={(event) => {
              setSignUpOptions({
                ...signUpOptions,
                username: (event.target as HTMLInputElement).value,
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium">
            {t("emailAddress")}
          </label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder={t("emailExample")}
            required
            className="h-11"
            onChange={(event) => {
              setSignUpOptions({
                ...signUpOptions,
                email: (event.target as HTMLInputElement).value,
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium">
            {t("password")}
          </label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder={t("createPassword")}
            required
            className="h-11"
            onChange={(event) => {
              setSignUpOptions({
                ...signUpOptions,
                password: (event.target as HTMLInputElement).value,
              });
            }}
          />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={isLoading}>
          {isLoading ? t("signingUp") : t("signUp")}
        </Button>
      </form>
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {t(error)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function SignUpDialog() {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-violet-700 dark:text-violet-300"
          >
            {t("signUp")}
          </Button>
        </DialogTrigger>
      </p>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-linear-to-br from-violet-500/10 via-popover to-sky-500/10 p-6 sm:max-w-md sm:p-8">
        <SignUpForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
