"use client";

import { useLocalization } from "@/providers/localization-provider";
import { useState } from "react";
import {
  ArrowLeft,
  Brain,
  CalendarDays,
  ExternalLink,
  Hash,
  Layers,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionSetDisplay } from "@/components/question-set-display";
import type { IQuestionSet } from "@/models/questionset";

interface QuestionSetGridViewProps {
  questionSets: IQuestionSet[];
  onClose: () => void;
  onDelete: (questionSet: IQuestionSet) => void;
  deletingId: string | null;
  isRefreshing: boolean;
}

export function QuestionSetGridView({
  questionSets,
  onClose,
  onDelete,
  deletingId,
  isRefreshing,
}: QuestionSetGridViewProps) {
  const { language, t } = useLocalization();
  const dateFormatter = new Intl.DateTimeFormat(language, {
    dateStyle: "short",
    timeZone: "UTC",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none bg-background p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 flex-row items-center gap-4 border-b bg-card px-6 py-5 pr-14 sm:px-8 sm:pr-14">
          <Button
            type="button"
            variant="ghost"
            className="-ml-2 w-fit"
            onClick={onClose}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("back")}
          </Button>
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-xl font-semibold">
              {t("allQuestionSets")}
            </DialogTitle>
            <DialogDescription>
              {t("questionSetCount", { count: questionSets.length })}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {questionSets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noQuestionSets")}
            </p>
          ) : (
            <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {questionSets.map((questionSet) => {
                const createdAt = new Date(questionSet.createdAt);
                const hasValidDate = !Number.isNaN(createdAt.getTime());
                const model = questionSet.metadata?.aiModel?.trim();
                const isDeleting = deletingId === questionSet._id;

                return (
                  <li
                    key={questionSet._id}
                    className="flex min-h-56 min-w-0 flex-col gap-6 rounded-xl border bg-card px-4 py-6 shadow-sm transition-shadow hover:shadow-md sm:px-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-white">
                        <Brain aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="wrap-anywhere text-sm leading-snug font-semibold">
                          {questionSet.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays aria-hidden="true" className="size-3" />
                            {hasValidDate ? (
                              <time dateTime={createdAt.toISOString()}>
                                {dateFormatter.format(createdAt)}
                              </time>
                            ) : (
                              "Date unavailable"
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Hash aria-hidden="true" className="size-3" />
                            {t(questionSet.totalCount === 1 ? "questionCountOne" : "questionCountMany", { count: questionSet.totalCount })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          title={model}
                          className="bg-blue-500/10 text-blue-700 dark:text-blue-300"
                        >
                          <Sparkles aria-hidden="true" className="size-3" />
                          {t("aiGenerated")}
                          {model && <span className="sr-only"> ({model})</span>}
                        </Badge>
                        {questionSet.metadata?.ragEnabled === true && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          >
                            <Layers aria-hidden="true" className="size-3" />
                            {t("ragEnhanced")}
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        className="w-full bg-linear-to-r from-violet-700 to-blue-700 font-semibold text-white hover:from-violet-800 hover:to-blue-800"
                        onClick={() => setSelectedId(questionSet._id)}
                      >
                        <ExternalLink aria-hidden="true" className="size-4" />
                        {t("viewDetails")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full border-destructive/20"
                        aria-label={
                          isDeleting
                            ? t("deletingNamed", { title: questionSet.title })
                            : t("deleteNamed", { title: questionSet.title })
                        }
                        disabled={isRefreshing || deletingId !== null}
                        onClick={() => onDelete(questionSet)}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        {isDeleting ? t("deleting") : t("delete")}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
      {selectedId && (
        <QuestionSetDisplay
          _id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </Dialog>
  );
}
