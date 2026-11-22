"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IQuestionSet } from "@/models/questionset";

interface QuestionSetDisplayProps {
  _id: string;
  onClose: () => void;
}

export function QuestionSetDisplay({ _id, onClose }: QuestionSetDisplayProps) {
  const [questionSet, setQuestionSet] = useState<IQuestionSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadQuestionSet() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/question/${encodeURIComponent(_id)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const data: { message: string } = await response.json();
          setError(data.message);
          return;
        }
        const data: { questionSet: IQuestionSet } = await response.json();
        if (!controller.signal.aborted) {
          setQuestionSet(data.questionSet);
        }
      } catch (error) {
        console.error("Failed to load question set", error);
        setQuestionSet(null);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void loadQuestionSet();
  }, [_id]);

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
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
            {questionSet?.title || "Question set"}
          </DialogTitle>
          <DialogDescription>
            {questionSet
              ? `${questionSet.totalCount} questions`
              : "Review questions, answers, and supporting details."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-4xl">
            {!questionSet && (
              <p role="status" className="text-sm text-muted-foreground">
                Loading question set...
              </p>
            )}
            {questionSet === null && (
              <div role="alert" className="space-y-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {questionSet && questionSet.questions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                This question set has no questions.
              </p>
            )}
            {questionSet && (
              <ol className="space-y-4">
                {questionSet.questions.map((question, index) => {
                  const details = [
                    { label: "Source context", value: question.source_context },
                    {
                      label: "Follow-up potential",
                      value: question.follow_up_potential,
                    },
                  ].filter((detail) => detail.value?.trim());
                  const keywords = question.keywords.filter((keyword) =>
                    keyword.trim(),
                  );

                  return (
                    <li
                      key={index}
                      className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-lg font-bold text-background">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">
                            Question
                          </p>
                          <h3 className="mt-1 whitespace-pre-wrap break-words text-base font-semibold">
                            {question.question}
                          </h3>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl bg-muted/50 p-4">
                        <h4 className="text-sm font-semibold">Answer</h4>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                          {question.answer}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          { label: "Difficulty", value: question.difficulty },
                          { label: "Category", value: question.category },
                          {
                            label: "Cognitive level",
                            value: question.cognitive_level,
                          },
                        ]
                          .filter((item) => item.value?.trim())
                          .map((item) => (
                            <span
                              key={item.label}
                              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                            >
                              {item.label}: {item.value}
                            </span>
                          ))}
                      </div>
                      {details.length > 0 && (
                        <dl className="mt-4 space-y-3 text-sm">
                          {details.map((detail) => (
                            <div key={detail.label}>
                              <dt className="font-medium">{detail.label}</dt>
                              <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                                {detail.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {(keywords.length > 0 ||
                        question.assessment_criteria?.trim() ||
                        question.industry_relevance?.trim()) && (
                        <dl className="mt-4 flex flex-wrap gap-3 border-t pt-4 text-sm">
                          {keywords.length > 0 && (
                            <div className="min-w-0 flex-1 basis-48">
                              <dt className="font-medium">Keywords</dt>
                              <dd className="mt-1 flex flex-wrap gap-2">
                                {keywords.map((keyword, keywordIndex) => (
                                  <span
                                    key={`${keywordIndex}-${keyword}`}
                                    className="break-all rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </dd>
                            </div>
                          )}
                          {question.assessment_criteria?.trim() && (
                            <div className="min-w-0 flex-1 basis-48">
                              <dt className="font-medium">
                                Assessment criteria
                              </dt>
                              <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                                {question.assessment_criteria}
                              </dd>
                            </div>
                          )}
                          {question.industry_relevance?.trim() && (
                            <div className="min-w-0 flex-1 basis-48">
                              <dt className="font-medium">
                                Industry relevance
                              </dt>
                              <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                                {question.industry_relevance}
                              </dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
