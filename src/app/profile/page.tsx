"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  KeyRound,
  ListOrdered,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";

const updateResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
  }),
});

const errorResponseSchema = z.object({
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

const keyResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    geminiTokenMasked: z.string().nullable(),
  }),
});

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [geminiToken, setGeminiToken] = useState("");
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const keyStatusVersion = useRef(0);
  const [keyResult, setKeyResult] = useState<
    | { userId: string; maskedKey: string | null; error?: never }
    | { userId: string; error: string; maskedKey?: never }
    | null
  >(null);
  const hasChanges = Boolean(username.trim() || email.trim());
  const userId = user?.id;
  const currentKeyResult = keyResult?.userId === userId ? keyResult : null;

  useEffect(() => {
    if (!userId) return;

    const activeUserId = userId;
    const version = keyStatusVersion.current;
    const controller = new AbortController();
    async function loadKeyStatus() {
      try {
        const response = await fetch("/api/auth/me", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(
            `Failed to load API key status (${response.status}).`,
          );
        }
        const data = keyResponseSchema.parse(await response.json()).user;
        if (data.id !== activeUserId) {
          throw new Error("User identity does not match.");
        }
        if (
          !controller.signal.aborted &&
          version === keyStatusVersion.current
        ) {
          setKeyResult({ userId: data.id, maskedKey: data.geminiTokenMasked });
        }
      } catch (error) {
        if (controller.signal.aborted || version !== keyStatusVersion.current)
          return;
        console.error("Failed to load API key status", error);
        setKeyResult({
          userId: activeUserId,
          error: "Could not load your API key status.",
        });
      }
    }

    void loadKeyStatus();
    return () => controller.abort();
  }, [userId]);

  async function handleUpdateInformation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!user || isUpdating || !hasChanges) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(username.trim() && { username: username.trim() }),
          ...(email.trim() && { email: email.trim() }),
        }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const parsed = errorResponseSchema.safeParse(data);
        toast.error(
          (parsed.success &&
            (parsed.data.errors?.join(" ") || parsed.data.message)) ||
            "Failed to update information.",
        );
        return;
      }

      const updatedUser = updateResponseSchema.parse(data).user;
      if (updatedUser.id !== user.id) {
        throw new Error("Updated user does not match the current user.");
      }
      setUser((previous) =>
        previous?.id === updatedUser.id
          ? { ...previous, ...updatedUser }
          : previous,
      );
      setUsername("");
      setEmail("");
      toast.success("Information updated successfully.");
    } catch (error) {
      console.error("Failed to update information", error);
      toast.error("Failed to update information. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleUpdateApiKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || isUpdatingKey || !geminiToken.trim()) return;

    setIsUpdatingKey(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiToken: geminiToken.trim() }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const parsed = errorResponseSchema.safeParse(data);
        toast.error(
          (parsed.success &&
            (parsed.data.errors?.join(" ") || parsed.data.message)) ||
            "Failed to update API key.",
        );
        return;
      }

      const updatedUser = keyResponseSchema.parse(data).user;
      if (updatedUser.id !== user.id) {
        throw new Error("Updated user does not match the current user.");
      }
      keyStatusVersion.current += 1;
      setKeyResult({
        userId: updatedUser.id,
        maskedKey: updatedUser.geminiTokenMasked,
      });
      setUser((previous) =>
        previous?.id === updatedUser.id
          ? { ...previous, geminiTokenMasked: updatedUser.geminiTokenMasked }
          : previous,
      );
      setGeminiToken("");
      toast.success("API key updated successfully.");
    } catch (error) {
      console.error("Failed to update API key", error);
      toast.error("Failed to update API key. Please try again.");
    } finally {
      setIsUpdatingKey(false);
    }
  }

  return (
    <div className="w-full h-full">
      <div className="mx-auto mt-8 w-3/4">
        <Button
          type="button"
          variant="outline"
          className="group cursor-pointer rounded-xl border-purple-500/20 bg-card px-4 font-medium shadow-sm hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300"
          onClick={() => router.push("/")}
        >
          <ArrowLeftIcon
            className="size-4 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          />
          Back
        </Button>
      </div>
      <div className="relative mx-auto my-10 flex min-h-28 w-3/4 flex-col justify-center overflow-hidden rounded-2xl bg-linear-to-r from-purple-600 to-blue-500 px-6 py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-48"
        >
          <div className="absolute -right-4 -top-12 size-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute right-8 top-2 size-20 rounded-full bg-linear-to-br from-white/40 to-blue-300/10" />
          <div className="absolute -bottom-8 right-0 size-24 rounded-full bg-linear-to-br from-purple-300/40 to-white/10" />
          <div className="absolute bottom-4 right-28 size-8 rounded-full bg-white/20 blur-sm" />
        </div>
        <h1 className="relative text-2xl font-bold text-white sm:text-3xl lg:pr-44 border-b">
          Manage your api setttings and API configuratinon
        </h1>
      </div>

      <div className="mx-auto my-10 grid w-3/4 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-lg shadow-black/5">
          <div className="mb-6 flex items-center gap-3 border-b pb-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300">
              <UserRound aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Personal information</h2>
              <p className="text-sm text-muted-foreground">
                Update your name or email.
              </p>
            </div>
          </div>
          <form
            key={`${user?.id ?? ""}:${user?.username ?? ""}:${user?.email ?? ""}`}
            onSubmit={handleUpdateInformation}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                name="username"
                type="text"
                placeholder="Enter your name"
                className="border-foreground/30"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={!user || isUpdating}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="border-foreground/30"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={!user || isUpdating}
              />
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button
                type="submit"
                disabled={!user || isUpdating || !hasChanges}
                className="bg-linear-to-r from-purple-600 to-blue-500 px-4 text-white hover:from-purple-700 hover:to-blue-600"
              >
                {isUpdating ? "Updating..." : "Update Information"}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border bg-card p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300">
                <KeyRound aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">API Key Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your Gemini API configuration.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleUpdateApiKey}
            className="rounded-2xl border bg-card p-6 shadow-lg shadow-black/5"
          >
            <label htmlFor="gemini-key" className="text-sm font-semibold">
              Gemini API key
            </label>
            {currentKeyResult?.error ? (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {currentKeyResult.error}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground" role="status">
                {!user
                  ? "Sign in to view your API key status."
                  : !currentKeyResult
                    ? "Loading API key status..."
                    : currentKeyResult.maskedKey
                      ? `Saved key: ${currentKeyResult.maskedKey}`
                      : "No API key saved."}
              </p>
            )}
            <Input
              id="gemini-key"
              name="geminiToken"
              type="password"
              autoComplete="off"
              placeholder={
                currentKeyResult?.maskedKey || "Enter a new Gemini API key"
              }
              value={geminiToken}
              onChange={(event) => setGeminiToken(event.target.value)}
              maxLength={255}
              disabled={!user || isUpdatingKey}
              className="mt-3 border-foreground/30"
            />
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
              Your API key is displayed in masked form.
            </p>
            <div className="mt-5 flex justify-end border-t pt-4">
              <Button
                type="submit"
                disabled={!user || isUpdatingKey || !geminiToken.trim()}
                className="bg-linear-to-r from-purple-600 to-blue-500 px-4 text-white hover:from-purple-700 hover:to-blue-600"
              >
                {isUpdatingKey ? "Updating..." : "Update API Key"}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border bg-card p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2">
              <ListOrdered
                aria-hidden="true"
                className="size-5 text-purple-600 dark:text-purple-300"
              />
              <h3 className="font-semibold">How to get an API key</h3>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Open{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-purple-700 underline underline-offset-4 dark:text-purple-300"
                >
                  Google AI Studio
                </a>{" "}
                and sign in.
              </li>
              <li>Create an API key and choose a Google Cloud project.</li>
              <li>Copy the key and keep it private.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
