"use client";

import {
  ArrowRight,
  FileStack,
  FileUp,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignUpDialog } from "@/components/sign-up-dialog";
import { useAuth } from "@/providers/auth-provider";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as z from "zod";

const errorResponseSchema = z.object({ message: z.string().optional() });

const features = [
  {
    icon: Sparkles,
    title: "RAG-powered exam generation",
    description: "Create questions grounded in your own source material.",
  },
  {
    icon: FileUp,
    title: "Bring your documents",
    description: "Upload PDF, Markdown, DOCX, and TXT files.",
  },
  {
    icon: ListChecks,
    title: "Professional question sets",
    description: "Turn your content into structured, ready-to-use questions.",
  },
  {
    icon: FileStack,
    title: "Multiple export options",
    description: "Take your question sets wherever you need them.",
  },
  {
    icon: ShieldCheck,
    title: "Secure authentication",
    description: "A dedicated space for your work.",
  },
];

const steps = [
  {
    title: "Upload your documents",
    description:
      "Start with your learning materials in a supported file format.",
  },
  {
    title: "Generate your questions",
    description: "Create a question set grounded in the content you provide.",
  },
  {
    title: "Review and export",
    description: "Review your questions and take them with you.",
  },
];

const exampleExportFormats = [
  {
    name: "PDF",
    description: "A shareable document for reading and printing.",
  },
  { name: "DOCX", description: "An editable document for your workflow." },
  { name: "Markdown", description: "A lightweight format for your notes." },
  { name: "JSON", description: "Structured data for other applications." },
];

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
});

export default function Home() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: {
        message: "Signed in successfully.";
        user: { id: string; email: string; username: string };
      } = await response.json();
      if (!response.ok) {
        const error = errorResponseSchema.safeParse(data);
        toast.error(
          error.success
            ? error.data.message || "Failed to sign in"
            : "Failed to sign in",
        );
        return;
      }

      setUser({
        email: data.user.email,
        id: data.user.id,
        username: data.user.username,
      });
      setPassword("");
      toast.success("Successfully signed in");
    } catch (error) {
      console.error("Failed to sign in", error);
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center bg-background bg-linear-to-br from-violet-500/10 via-transparent to-emerald-500/10 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <section className="rounded-3xl border border-violet-500/20 bg-card bg-linear-to-br from-violet-500/10 via-transparent to-sky-500/10 px-6 py-10 text-card-foreground shadow-xl shadow-violet-500/10 sm:px-10 lg:px-12 lg:py-12">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              <Sparkles aria-hidden="true" className="size-3.5" />
              YOUR AI QUESTION WORKSPACE
            </div>
            <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Your documents.
              <br />
              <span className="bg-linear-to-r from-violet-700 via-indigo-600 to-teal-700 bg-clip-text text-transparent dark:from-violet-300 dark:via-sky-300 dark:to-emerald-300">
                Better questions.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Transform your materials into thoughtful questions and exams, with
              everything you need in one place.
            </p>

            <ul className="mt-9 space-y-5">
              {features.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/15 bg-linear-to-br from-violet-500/15 to-sky-500/15 text-violet-700 dark:text-violet-300">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs text-muted-foreground">
              Features are in development.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="sign-in-title"
          className="flex items-center rounded-3xl border border-emerald-500/20 bg-card bg-linear-to-br from-emerald-500/10 via-transparent to-sky-500/10 px-6 py-12 text-card-foreground shadow-xl shadow-emerald-500/10 sm:px-10 lg:px-16"
        >
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/20 to-sky-500/20 text-emerald-700 dark:text-emerald-300">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              Welcome back
            </p>
            <h2
              id="sign-in-title"
              className="mt-2 text-3xl font-semibold tracking-tight"
            >
              Sign in to your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Sign in to access your question workspace.
            </p>

            <form className="mt-8 space-y-5" onSubmit={signin}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </form>
            <SignUpDialog />
          </div>
        </section>
      </div>
      <section
        aria-labelledby="why-choose-title"
        className="mt-14 w-full max-w-6xl"
      >
        <h2
          id="why-choose-title"
          className="text-center text-2xl font-semibold tracking-tight"
        >
          Why choose our platform
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Designed to make creating questions from your materials simpler.
        </p>
        <ul className="mt-7 flex flex-col gap-4 md:flex-row">
          {features.slice(0, 3).map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex-1 rounded-2xl border border-violet-500/15 bg-card bg-linear-to-br from-violet-500/10 to-transparent p-6 text-card-foreground shadow-sm shadow-violet-500/10"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/20 to-sky-500/20 text-violet-700 dark:text-violet-300">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section
        aria-labelledby="how-it-works-title"
        className="mt-16 w-full max-w-6xl"
      >
        <h2
          id="how-it-works-title"
          className="text-center text-2xl font-semibold tracking-tight"
        >
          How it works
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          From your documents to a question set in three steps.
        </p>
        <ol className="mt-7 flex flex-col gap-4 md:flex-row">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex-1 rounded-2xl border border-sky-500/15 bg-card bg-linear-to-br from-sky-500/10 to-transparent p-6 text-card-foreground shadow-sm shadow-sky-500/10"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-sky-500/20 to-emerald-500/20 text-sm font-semibold text-sky-700 dark:text-sky-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="export-formats-title"
        className="mt-16 w-full max-w-6xl"
      >
        <h2
          id="export-formats-title"
          className="text-center text-2xl font-semibold tracking-tight"
        >
          Multiple export formats
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Example formats being considered for your question sets.
        </p>
        <ul className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          {exampleExportFormats.map((format) => (
            <li
              key={format.name}
              className="flex-1 basis-48 rounded-2xl border border-emerald-500/15 bg-card bg-linear-to-br from-emerald-500/10 to-transparent p-6 text-card-foreground shadow-sm shadow-emerald-500/10"
            >
              <FileStack
                aria-hidden="true"
                className="size-5 text-emerald-700 dark:text-emerald-300"
              />
              <h3 className="mt-4 font-semibold">{format.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {format.description}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Export is in development; supported formats are not yet finalized.
        </p>
      </section>
    </div>
  );
}
