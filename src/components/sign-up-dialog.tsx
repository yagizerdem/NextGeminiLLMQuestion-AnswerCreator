"use client";

import { useLayoutEffect, useRef } from "react";
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

function SignUpForm() {
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!contentRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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

  return (
    <div ref={contentRef}>
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-sky-500/20 text-violet-700 dark:text-violet-300">
        <UserPlus aria-hidden="true" className="size-5" />
      </div>
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">Create an account</DialogTitle>
        <DialogDescription>
          Sign up to start creating questions from your documents.
        </DialogDescription>
      </DialogHeader>
      <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium">
            Email address
          </label>
          <Input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" required className="h-11" />
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium">
            Password
          </label>
          <Input id="signup-password" type="password" autoComplete="new-password" placeholder="Create a password" required className="h-11" />
        </div>
        <Button type="submit" disabled className="h-11 w-full">
          Sign up
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Sign up is not available yet.
        </p>
      </form>
    </div>
  );
}

export function SignUpDialog() {
  return (
    <Dialog>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <DialogTrigger asChild>
          <Button type="button" variant="link" className="h-auto p-0 text-violet-700 dark:text-violet-300">
            Sign up
          </Button>
        </DialogTrigger>
      </p>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-linear-to-br from-violet-500/10 via-popover to-sky-500/10 p-6 sm:max-w-md sm:p-8">
        <SignUpForm />
      </DialogContent>
    </Dialog>
  );
}
