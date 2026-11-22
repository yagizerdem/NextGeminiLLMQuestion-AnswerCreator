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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignUpDialog } from "@/components/sign-up-dialog";
import { useAuth } from "@/providers/auth-provider";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as z from "zod";

const errorResponseSchema = z.object({ message: z.string().optional() });
const difficultySchema = z.enum(["easy", "medium", "hard"]);
const uploadResponseSchema = z.object({
  document: z.object({
    id: z.string(),
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number(),
    status: z.string(),
  }),
});

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
}

export default function Home() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [difficulty, setDifficulty] =
    useState<z.infer<typeof difficultySchema>>("medium");
  const [questionCount, setQuestionCount] = useState<number | "">(5);

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!user) {
      toast.error("Please sign in to upload a document.");
      return;
    }
    if (!(file instanceof File) || !file.name) {
      toast.error("Please choose a document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must not exceed 10 MiB.");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Failed to upload document.";
        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          const error = errorResponseSchema.safeParse(await response.json());
          if (error.success && error.data.message) message = error.data.message;
        }
        toast.error(message);
        return;
      }

      const data = uploadResponseSchema.parse(await response.json());
      setDocument(data.document);
      form.reset();
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Failed to upload document", error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function generateQuestions() {
    try {
      setIsGenerating(true);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId: document?.id,
          difficulty,
          questionCount,
        }),
      });
      console.log(response);

      if (!response.ok) {
        let message = "Failed to generate questions.";
        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          const error = errorResponseSchema.safeParse(await response.json());
          if (error.success && error.data.message) message = error.data.message;
        }
        toast.error(message);
        return;
      }

      const data = await response.json();
      console.log(data);
    } finally {
      setIsGenerating(false);
    }
  }

  if (!user) {
    return <HomePage />;
  }

  return (
    <div className="w-full flex-1 bg-background bg-linear-to-br from-violet-500/10 via-transparent to-emerald-500/10 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-6 lg:flex-col">
          <section
            aria-labelledby="upload-document-title"
            className="w-full rounded-3xl border border-violet-500/20 bg-card bg-linear-to-br from-violet-500/10 via-transparent to-sky-500/10 p-6 text-card-foreground shadow-xl shadow-violet-500/10 sm:p-8"
          >
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-sky-500/20 text-violet-700 dark:text-violet-300">
              <FileUp aria-hidden="true" className="size-5" />
            </div>
            <h1 id="upload-document-title" className="text-2xl font-semibold">
              Upload a document
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a document to add to your workspace.
            </p>
            <form className="mt-6 space-y-4" onSubmit={uploadDocument}>
              <div className="space-y-2">
                <label htmlFor="document-file" className="text-sm font-medium">
                  Document
                </label>
                <Input
                  id="document-file"
                  name="file"
                  type="file"
                  accept=".pdf,.docx,.md,.markdown,.txt"
                  required
                  disabled={isUploading || isGenerating}
                  aria-describedby="document-file-help"
                  className="h-auto min-h-11 py-2"
                />
                <p
                  id="document-file-help"
                  className="text-xs text-muted-foreground"
                >
                  PDF, DOCX, Markdown or TXT, up to 10 MiB.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isUploading || isGenerating}
              >
                {isUploading ? "Uploading..." : "Upload document"}
              </Button>
            </form>
            {document && (
              <p className="mt-4 text-sm text-muted-foreground" role="status">
                Uploaded: {document.originalName}
              </p>
            )}
          </section>
          <section
            aria-labelledby="configure-generation-title"
            className="w-full rounded-3xl border border-sky-500/20 bg-card p-6 text-card-foreground shadow-sm sm:p-8"
          >
            <h2
              id="configure-generation-title"
              className="text-lg font-semibold"
            >
              Configure generation
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="min-w-0 space-y-2">
                <label htmlFor="question-level" className="text-sm font-medium">
                  Question level
                </label>
                <Select
                  name="difficulty"
                  value={difficulty}
                  onValueChange={(value) =>
                    setDifficulty(difficultySchema.parse(value))
                  }
                >
                  <SelectTrigger id="question-level" className="w-full">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <label htmlFor="question-count" className="text-sm font-medium">
                  Question count
                </label>
                <Input
                  id="question-count"
                  name="questionCount"
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={questionCount}
                  onChange={(event) => {
                    const value = event.currentTarget.valueAsNumber;
                    setQuestionCount(Number.isNaN(value) ? "" : value);
                  }}
                  placeholder="e.g. 10"
                />
              </div>
            </div>
          </section>
          <section>
            <Button
              type="button"
              title="Exam generation is not available yet"
              className="h-11 w-full bg-linear-to-r from-violet-600 to-sky-600 text-white"
              onMouseUp={generateQuestions}
              disabled={isGenerating || isUploading}
            >
              Generate exam
            </Button>
          </section>
        </div>
        <div aria-hidden="true" className="grid grid-rows-3 gap-4">
          <div className="min-h-36 rounded-3xl border border-violet-500/20 bg-card shadow-sm" />
          <div className="min-h-36 rounded-3xl border border-sky-500/20 bg-card shadow-sm" />
          <div className="min-h-36 rounded-3xl border border-emerald-500/20 bg-card shadow-sm" />
        </div>
      </div>
    </div>
  );
}

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

function HomePage() {
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
