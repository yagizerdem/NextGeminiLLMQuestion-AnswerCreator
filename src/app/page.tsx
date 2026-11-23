"use client";

import {
  fullLanguageName,
  useLocalization,
} from "@/providers/localization-provider";
import { getAuthErrorKey } from "@/lib/localize-auth-error";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  Cpu,
  FileStack,
  FileUp,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignUpDialog } from "@/components/sign-up-dialog";
import { QuestionSetDisplay } from "@/components/question-set-display";
import { QuestionSetGridView } from "@/components/question-set-grid-view";
import { useAuth } from "@/providers/auth-provider";
import {
  useState,
  type FormEvent,
  useRef,
  useEffect,
  useMemo,
  Fragment,
} from "react";
import { toast } from "sonner";
import * as z from "zod";
import { IQuestionSet } from "@/models/questionset";

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
}

interface Stats {
  totalQuestions: number;
  totalProcessedDocs: number;
  totalQuestionSets: number;
  totalSessions: number;
  avgQuestionsPerSession: number;
}

export default function Home() {
  const { language, t } = useLocalization();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [questionSetToDelete, setQuestionSetToDelete] =
    useState<IQuestionSet | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "export"
  >("medium");
  const [questionCount, setQuestionCount] = useState<number | "">(5);
  const [questionSets, setQuestionSets] = useState<IQuestionSet[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [questionSetDisplayId, setQuestionSetDisplayId] = useState<
    string | null
  >(null);
  const [showQuestionSetGridView, setShowQuestionSetGridView] = useState(false);

  async function uploadDocument() {
    if (!user) {
      toast.error(t("signInToUpload"));
      return;
    }

    if (!file) {
      toast.error(t("selectFileToUpload"));
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      toast.error(t("fileTooLarge"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error(t("uploadFailed"));
        return;
      }

      const data: { document: Document } = await response.json();
      setDocument(data.document);
      toast.success(t("uploadSuccess"));
    } catch (error) {
      console.error("Failed to upload document", error);
      toast.error(t("uploadRetry"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          language: fullLanguageName(language),
        }),
      });

      if (!response.ok) {
        toast.error(t("generationFailed"));
        return;
      }

      const data: { questionSet: IQuestionSet } = await response.json();

      setQuestionSets((prev) => [data.questionSet, ...prev]);
    } catch (error) {
      console.error("Failed to generate questions", error);
      toast.error(t("generationRetry"));
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setQuestionSets([]);
    } else {
      refreshQuestionSets();
    }
  }, [user]);

  async function refreshQuestionSets() {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/question");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data: { questionSets: IQuestionSet[] } = await response.json();
      setQuestionSets(data.questionSets);
    } catch (error) {
      console.error("Failed to refresh question sets", error);
      toast.error(t("refreshQuestionSetsFailed"));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function deleteQuestionSet(questionSet: IQuestionSet) {
    if (!user || isRefreshing || deletingId) return;
    setDeletingId(questionSet._id);
    try {
      const response = await fetch(
        `/api/question?id=${encodeURIComponent(questionSet._id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      setQuestionSets((previous) =>
        previous.filter((item) => item._id !== questionSet._id),
      );
      setQuestionSetToDelete(null);
      toast.success(t("questionSetDeleted"));
    } catch (error) {
      console.error("Failed to delete question set", error);
      toast.error(t("questionSetDeleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  const stats = useMemo<Stats>(() => {
    const totalSessions = questionSets.length;
    const totalQuestions = questionSets.reduce(
      (total, questionSet) => total + questionSet.totalCount,
      0,
    );
    const totalProcessedDocs = new Set(
      questionSets.map((questionSet) => questionSet.documentId.toString()),
    ).size;

    return {
      totalQuestions,
      totalProcessedDocs,
      totalQuestionSets: totalSessions,
      totalSessions,
      avgQuestionsPerSession:
        totalSessions === 0 ? 0 : totalQuestions / totalSessions,
    };
  }, [questionSets]);

  if (!user) {
    return <HomePage />;
  }

  return (
    <Fragment>
      <Dialog
        open={questionSetToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingId) setQuestionSetToDelete(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(event) => {
            if (deletingId) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (deletingId) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("deleteQuestionSet")}</DialogTitle>
            <DialogDescription>
              {t("confirmDeleteQuestionSet", {
                title: questionSetToDelete?.title ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default"
              type="button"
              variant="outline"
              disabled={deletingId !== null}
              onClick={() => setQuestionSetToDelete(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default"
              type="button"
              variant="destructive"
              disabled={deletingId !== null}
              onClick={() => {
                if (questionSetToDelete) {
                  void deleteQuestionSet(questionSetToDelete);
                }
              }}
            >
              {deletingId ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {questionSetDisplayId && (
        <QuestionSetDisplay
          _id={questionSetDisplayId}
          onClose={() => setQuestionSetDisplayId(null)}
        />
      )}
      {showQuestionSetGridView && (
        <QuestionSetGridView
          questionSets={questionSets}
          onClose={() => setShowQuestionSetGridView(false)}
          onDelete={setQuestionSetToDelete}
          deletingId={deletingId}
          isRefreshing={isRefreshing}
        />
      )}
      <div className="w-full flex-1 bg-background bg-linear-to-br from-violet-500/10 via-transparent to-emerald-500/10 px-4 py-10 sm:px-6 lg:py-14">
        <div className="w-3/4 mx-auto">
          <WelcomeJumbutron />
        </div>
        <br />
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
                {t("uploadHeading")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("uploadDescription")}
              </p>
              <label
                htmlFor="document-file"
                className={`relative mt-5 flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-violet-500/30 bg-background/50 p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-violet-500 ${
                  isUploading || isGenerating
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:border-violet-500/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="document-file"
                  name="file"
                  type="file"
                  accept=".pdf,.docx,.md,.markdown,.txt"
                  onChange={(event) => {
                    const selectedFile = event.currentTarget.files?.[0] ?? null;
                    if (!selectedFile) return;
                    setFile(selectedFile);
                    setDocument(null); // clear old document reference
                  }}
                  disabled={isUploading || isGenerating}
                  aria-describedby="document-file-help"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                {file ? (
                  <CircleCheck
                    aria-hidden="true"
                    className="size-10 text-green-600"
                  />
                ) : (
                  <FileUp
                    aria-hidden="true"
                    className="size-10 text-violet-600"
                  />
                )}
                <span
                  className="max-w-full break-all text-sm font-medium"
                  role="status"
                >
                  {isUploading
                    ? t("uploading")
                    : file
                      ? file.name
                      : t("chooseDocument")}
                </span>
                <p
                  id="document-file-help"
                  className="text-xs text-muted-foreground"
                >
                  {t("fileTypesHint")}
                </p>
              </label>
              <br />
            </section>
            <section
              aria-labelledby="configure-generation-title"
              className="w-full rounded-3xl border border-sky-500/20 bg-card p-6 text-card-foreground shadow-sm sm:p-8"
            >
              <h2
                id="configure-generation-title"
                className="text-lg font-semibold"
              >
                {t("configureGeneration")}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="min-w-0 space-y-2">
                  <label
                    htmlFor="question-level"
                    className="text-sm font-medium"
                  >
                    {t("questionLevel")}
                  </label>
                  <Select
                    name="difficulty"
                    value={difficulty}
                    onValueChange={(value) => setDifficulty(value as any)}
                  >
                    <SelectTrigger id="question-level" className="w-full">
                      <SelectValue placeholder={t("selectLevel")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">{t("easy")}</SelectItem>
                      <SelectItem value="medium">{t("medium")}</SelectItem>
                      <SelectItem value="hard">{t("hard")}</SelectItem>
                      <SelectItem value="expert">{t("expert")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 space-y-2">
                  <label
                    htmlFor="question-count"
                    className="text-sm font-medium"
                  >
                    {t("questionCount")}
                  </label>
                  <Input
                    id="question-count"
                    name="questionCount"
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={questionCount}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      setQuestionCount(Number.isNaN(value) ? "" : value);
                    }}
                    placeholder={t("questionCountExample")}
                  />
                </div>
              </div>
            </section>
            <section className="flex items-center">
              {file && !document && (
                <Button
                  className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default mr-auto h-11 bg-linear-to-r from-emerald-600 to-teal-600 px-6 text-white"
                  onMouseUp={uploadDocument}
                  disabled={isUploading}
                >
                  {t("uploadDocument")}
                </Button>
              )}

              {document && (
                <Button
                  type="button"
                  className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default ml-auto h-11 bg-linear-to-r from-violet-600 to-sky-600 px-6 text-white"
                  onClick={generateQuestions}
                  disabled={
                    isGenerating ||
                    isUploading ||
                    isRefreshing ||
                    document == null
                  }
                >
                  {t("generateQuestions")}
                </Button>
              )}
            </section>
            <section aria-labelledby="question-sets-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="question-sets-title" className="text-lg font-semibold">
                  {t("questionSets")}
                </h2>
                <Button
                  className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default"
                  type="button"
                  variant="outline"
                  onClick={refreshQuestionSets}
                  disabled={isRefreshing || isGenerating || deletingId !== null}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                  {isRefreshing ? t("refreshing") : t("refresh")}
                </Button>
              </div>
              <ul className="flex flex-col gap-3">
                {questionSets.slice(0, 10).map((questionSet) => (
                  <li
                    key={questionSet._id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-violet-500/15 bg-card p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/15 to-sky-500/15 text-violet-600 dark:text-violet-300">
                      <ListChecks aria-hidden="true" className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold">
                        {questionSet.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("questionSet")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                      {t(
                        questionSet.totalCount === 1
                          ? "questionCountOne"
                          : "questionCountMany",
                        { count: questionSet.totalCount },
                      )}
                    </span>
                    <Button
                      className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default"
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuestionSetDisplayId(questionSet._id)}
                    >
                      {t("view")}
                    </Button>
                    <Button
                      className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default"
                      type="button"
                      variant="destructive"
                      size="sm"
                      aria-label={t("deleteNamed", {
                        title: questionSet.title,
                      })}
                      disabled={isRefreshing || deletingId !== null}
                      onClick={() => setQuestionSetToDelete(questionSet)}
                    >
                      {deletingId === questionSet._id
                        ? t("deleting")
                        : t("delete")}
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between gap-3">
                {questionSets.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    {t("showingQuestionSets", {
                      visible: 10,
                      total: questionSets.length,
                    })}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuestionSetGridView(true)}
                  className="disabled:cursor-default aria-disabled:cursor-default cursor-pointer group mx-auto h-11 w-3/4 rounded-xl border-violet-500/25 bg-card font-semibold text-violet-700 shadow-sm transition-colors hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                >
                  {t("viewAll")}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </Button>
              </div>
            </section>
          </div>
          <div className="flex flex-col gap-4">
            <section
              aria-labelledby="generation-details-title"
              className="min-h-36 rounded-3xl border border-violet-500/20 bg-card bg-linear-to-br from-violet-500/10 via-transparent to-sky-500/10 p-6 text-card-foreground shadow-xl shadow-violet-500/10 sm:p-8"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-sky-500/20 text-violet-700 dark:text-violet-300">
                <Sparkles aria-hidden="true" className="size-5" />
              </div>
              <h2
                id="generation-details-title"
                className="text-lg font-semibold"
              >
                {t("generationDetails")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("workspaceOverview")}
              </p>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-500/10 bg-background/60 p-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Cpu
                      aria-hidden="true"
                      className="size-4 shrink-0 text-violet-600 dark:text-violet-300"
                    />
                    {t("aiEngine")}
                  </dt>
                  <dd className="text-right font-medium text-violet-700 dark:text-violet-300">
                    Gemini 3.5 Flash Lite
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-500/10 bg-background/60 p-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Clock3
                      aria-hidden="true"
                      className="size-4 shrink-0 text-sky-600 dark:text-sky-300"
                    />
                    {t("processingSpeed")}
                  </dt>
                  <dd className="text-right font-medium">
                    {t("variesByDocument")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-500/10 bg-background/60 p-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <FileStack
                      aria-hidden="true"
                      className="size-4 shrink-0 text-violet-600 dark:text-violet-300"
                    />
                    {t("exportFormats")}
                  </dt>
                  <dd className="rounded-full bg-sky-500/10 px-2.5 py-1 text-right text-xs font-medium text-sky-700 dark:text-sky-300">
                    JSON, CSV, PDF
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-500/10 bg-background/60 p-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <FileUp
                      aria-hidden="true"
                      className="size-4 shrink-0 text-sky-600 dark:text-sky-300"
                    />
                    {t("inputFormats")}
                  </dt>
                  <dd className="text-right font-medium">
                    PDF, DOCX, Markdown, TXT
                  </dd>
                </div>
              </dl>
            </section>
            <section
              aria-labelledby="workspace-stats-title"
              className="h-fit rounded-3xl border border-sky-500/20 bg-card bg-linear-to-br from-sky-500/10 via-transparent to-emerald-500/10 p-3 text-card-foreground shadow-xl shadow-sky-500/10"
            >
              <h2 id="workspace-stats-title" className="text-lg font-semibold">
                {t("quickStats")}
              </h2>
              <dl className="mt-3 space-y-1">
                <div className="flex items-center justify-between gap-1 rounded-2xl border border-sky-500/10 bg-background/60 p-1">
                  <dt className="text-xs text-muted-foreground">
                    {t("totalQuestions")}
                  </dt>
                  <dd className="shrink-0 text-right text-2xl font-semibold text-sky-700 dark:text-sky-300">
                    {stats.totalQuestions}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-1 rounded-2xl border border-sky-500/10 bg-background/60 p-1">
                  <dt className="text-xs text-muted-foreground">
                    {t("processedDocuments")}
                  </dt>
                  <dd className="shrink-0 text-right text-2xl font-semibold text-sky-700 dark:text-sky-300">
                    {stats.totalProcessedDocs}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-1 rounded-2xl border border-sky-500/10 bg-background/60 p-1">
                  <dt className="text-xs text-muted-foreground">
                    {t("questionSets")}
                  </dt>
                  <dd className="shrink-0 text-right text-2xl font-semibold text-sky-700 dark:text-sky-300">
                    {stats.totalQuestionSets}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-1 rounded-2xl border border-sky-500/10 bg-background/60 p-1">
                  <dt className="text-xs text-muted-foreground">
                    {t("sessions")}
                  </dt>
                  <dd className="shrink-0 text-right text-2xl font-semibold text-sky-700 dark:text-sky-300">
                    {stats.totalSessions}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-1 rounded-2xl border border-sky-500/10 bg-background/60 p-1">
                  <dt className="text-xs text-muted-foreground">
                    {t("averageQuestions")}
                  </dt>
                  <dd className="shrink-0 text-right text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                    {stats.avgQuestionsPerSession.toLocaleString(language, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </dd>
                </div>
              </dl>
            </section>
            <section
              aria-labelledby="pro-tips-title"
              className="min-h-fit rounded-3xl border border-emerald-500/20 bg-card bg-linear-to-br from-emerald-500/10 via-transparent to-sky-500/10 p-6 text-card-foreground shadow-xl shadow-emerald-500/10 sm:p-8"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/20 to-sky-500/20 text-emerald-700 dark:text-emerald-300">
                <Lightbulb aria-hidden="true" className="size-5" />
              </div>
              <h2 id="pro-tips-title" className="text-lg font-semibold">
                {t("proTips")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("proTipsDescription")}
              </p>
              <ul className="mt-5 space-y-3">
                {[
                  t("tipClearDocuments"),
                  t("tipDifficulty"),
                  t("tipUploadLimits"),
                  t("tipReviewAnswers"),
                ].map((tip) => (
                  <li
                    key={tip}
                    className="flex gap-3 rounded-xl border border-emerald-500/10 bg-background/60 p-3 text-sm text-muted-foreground"
                  >
                    <CircleCheck
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

const features = [
  {
    icon: Sparkles,
    title: "ragExamGeneration",
    description: "sourceGroundedQuestions",
  },
  {
    icon: FileUp,
    title: "bringDocuments",
    description: "supportedFormats",
  },
  {
    icon: ListChecks,
    title: "professionalQuestionSets",
    description: "structuredQuestions",
  },
  {
    icon: FileStack,
    title: "multipleExportOptions",
    description: "takeQuestionSets",
  },
  {
    icon: ShieldCheck,
    title: "secureAuthentication",
    description: "dedicatedWorkspace",
  },
] as const;

const steps = [
  {
    title: "uploadYourDocuments",
    description: "supportedLearningMaterials",
  },
  {
    title: "generateYourQuestions",
    description: "groundQuestionSet",
  },
  {
    title: "reviewAndExport",
    description: "reviewYourQuestions",
  },
] as const;

const exportFormats = [
  {
    name: "PDF",
    description: "pdfDescription",
  },
  { name: "CSV", description: "csvDescription" },
  { name: "JSON", description: "jsonDescription" },
] as const;

function HomePage() {
  const { t } = useLocalization();
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
        message: string;
        user: { id: string; email: string; username: string };
      } = await response.json();
      if (!response.ok) {
        toast.error(t(getAuthErrorKey(data.message, "signInFailed")));
        return;
      }

      setUser({
        email: data.user.email,
        id: data.user.id,
        username: data.user.username,
      });
      setPassword("");
      toast.success(t("signedIn"));
    } catch (error) {
      console.error("Failed to sign in", error);
      toast.error(t("signInRetry"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center bg-background bg-linear-to-br from-violet-500/10 via-transparent to-emerald-500/10 px-4 py-10 sm:px-6 lg:py-14">
      <div className="w-3/4">
        <WelcomeJumbutron />
      </div>
      <br />
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <section className="rounded-3xl border border-violet-500/20 bg-card bg-linear-to-br from-violet-500/10 via-transparent to-sky-500/10 px-6 py-10 text-card-foreground shadow-xl shadow-violet-500/10 sm:px-10 lg:px-12 lg:py-12">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              <Sparkles aria-hidden="true" className="size-3.5" />
              {t("aiWorkspace")}
            </div>
            <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {t("yourDocuments")}
              <br />
              <span className="bg-linear-to-r from-violet-700 via-indigo-600 to-teal-700 bg-clip-text text-transparent dark:from-violet-300 dark:via-sky-300 dark:to-emerald-300">
                {t("betterQuestions")}
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              {t("landingDescription")}
            </p>

            <ul className="mt-9 space-y-5">
              {features.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/15 bg-linear-to-br from-violet-500/15 to-sky-500/15 text-violet-700 dark:text-violet-300">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{t(title)}</h2>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {t(description)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs text-muted-foreground">
              {t("featuresInDevelopment")}
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
              {t("welcomeBack")}
            </p>
            <h2
              id="sign-in-title"
              className="mt-2 text-3xl font-semibold tracking-tight"
            >
              {t("signInAccount")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("signInWorkspace")}
            </p>

            <form className="mt-8 space-y-5" onSubmit={signin}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t("emailAddress")}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailExample")}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  {t("password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("enterPassword")}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default h-11 w-full"
                disabled={loading}
              >
                {loading ? t("signingIn") : t("signIn")}{" "}
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
          {t("whyChoose")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("whyChooseDescription")}
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
              <h3 className="mt-4 font-semibold">{t(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(description)}
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
          {t("howItWorks")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("threeSteps")}
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
              <h3 className="mt-4 font-semibold">{t(step.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(step.description)}
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
          {t("multipleExportFormats")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("downloadPreferred")}
        </p>
        <ul className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          {exportFormats.map((format) => (
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
                {t(format.description)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function WelcomeJumbutron() {
  const { t } = useLocalization();
  const { user } = useAuth();

  return (
    <section className="relative isolate overflow-hidden w-full rounded-2xl bg-linear-to-r from-blue-700 via-indigo-700 to-purple-700 px-6 py-6 text-white sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-32 overflow-hidden"
      >
        <span className="absolute -top-10 -right-8 size-32 rounded-full bg-white/10" />
        <span className="absolute -right-6 -bottom-12 size-24 rounded-full bg-white/10" />
      </div>
      <h2 className="wrap-anywhere text-xl font-semibold sm:text-2xl">
        {user ? t("welcomeNamed", { username: user.username }) : t("welcome")}{" "}
        <span aria-hidden="true">&#128075;</span>
      </h2>
      <p className="mt-2 text-sm text-white/90">
        {user ? t("welcomeMember") : t("welcomeGuest")}
      </p>
    </section>
  );
}
