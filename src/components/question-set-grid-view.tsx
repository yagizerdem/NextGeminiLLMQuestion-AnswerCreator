"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, ListChecks } from "lucide-react";
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

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function QuestionSetGridView({
  questionSets,
  onClose,
  onDelete,
  deletingId,
  isRefreshing,
}: QuestionSetGridViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none bg-background p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b bg-card px-6 py-5 pr-14 sm:px-8 sm:pr-14">
          <Button
            type="button"
            variant="ghost"
            className="-ml-2 w-fit"
            onClick={onClose}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back
          </Button>
          <DialogTitle className="text-xl font-semibold">
            All question sets
          </DialogTitle>
          <DialogDescription>
            {questionSets.length} question sets
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {questionSets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No question sets yet.
            </p>
          ) : (
            <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {questionSets.map((questionSet) => {
                const createdAt = new Date(questionSet.createdAt);
                const hasValidDate = !Number.isNaN(createdAt.getTime());

                return (
                  <li
                    key={questionSet._id}
                    className="flex min-w-0 flex-col gap-4 rounded-2xl border border-violet-500/15 bg-card p-5 shadow-md shadow-violet-500/10 transition-shadow hover:shadow-lg hover:shadow-violet-500/15"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
                        <ListChecks aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-semibold">
                          {questionSet.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Questions: #{questionSet.totalCount}
                        </p>
                      </div>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays aria-hidden="true" className="size-4" />
                      {hasValidDate ? (
                        <>
                          Created:{" "}
                          <time dateTime={createdAt.toISOString()}>
                            {dateFormatter.format(createdAt)}
                          </time>
                        </>
                      ) : (
                        "Creation date unavailable"
                      )}
                    </p>
                    <div className="mt-auto flex gap-2">
                      <Button
                        type="button"
                        className="group h-10 flex-1 bg-linear-to-r from-violet-600 to-blue-500 font-semibold text-white shadow-sm hover:from-violet-700 hover:to-blue-600"
                        onClick={() => setSelectedId(questionSet._id)}
                      >
                        View
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform group-hover:translate-x-1"
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="h-10"
                        aria-label={`Delete ${questionSet.title}`}
                        disabled={isRefreshing || deletingId !== null}
                        onClick={() => onDelete(questionSet)}
                      >
                        {deletingId === questionSet._id
                          ? "Deleting..."
                          : "Delete"}
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
