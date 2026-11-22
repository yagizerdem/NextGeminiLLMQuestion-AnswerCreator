"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Download, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { IQuestionSet } from "@/models/questionset";

interface QuestionSetDisplayProps {
  _id: string;
  onClose: () => void;
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function exportAsJSON(questionSet: IQuestionSet) {
  const blob = new Blob([JSON.stringify(questionSet, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadFile(blob, `question-set-${questionSet._id}.json`);
}

function exportAsCSV(questionSet: IQuestionSet) {
  const columns = [
    "question",
    "answer",
    "difficulty",
    "category",
    "cognitive_level",
    "keywords",
    "source_context",
    "assessment_criteria",
    "follow_up_potential",
    "industry_relevance",
  ] as const;
  const escapeCell = (value: string) => {
    const safeValue = /^[\t\r\n ]*[=+\-@\t\r\n]/.test(value)
      ? `'${value}`
      : value;
    return `"${safeValue.replace(/"/g, '""')}"`;
  };
  const rows = questionSet.questions.map((question) =>
    columns.map((column) => {
      const value = question[column];
      return escapeCell(
        Array.isArray(value) ? JSON.stringify(value) : (value ?? ""),
      );
    }),
  );
  const csv = [columns.map(escapeCell), ...rows]
    .map((row) => row.join(","))
    .join("\r\n");
  downloadFile(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    `question-set-${questionSet._id}.csv`,
  );
}

async function downloadPDF(
  documentDefinition: TDocumentDefinitions,
  filename: string,
) {
  const [pdfMake, fontModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const stream = pdfMake
    .createPdf(documentDefinition, undefined, undefined, fontModule.default)
    .getStream();
  const chunks = await new Promise<BlobPart[]>((resolve, reject) => {
    const parts: BlobPart[] = [];
    stream.on("data", (chunk: Uint8Array) => {
      parts.push(new Uint8Array(chunk).buffer);
    });
    stream.on("end", () => resolve(parts));
    stream.on("error", reject);
    stream.end();
  });
  downloadFile(new Blob(chunks, { type: "application/pdf" }), filename);
}

async function exportAsPDF(questionSet: IQuestionSet) {
  const content: Content[] = [
    { text: "QUESTION SET", style: "eyebrow" },
    { text: questionSet.title, style: "title" },
    { text: "Questions and answers", style: "sectionTitle" },
  ];

  questionSet.questions.forEach((question, index) => {
    const details = [
      { label: "Difficulty", value: question.difficulty },
      { label: "Category", value: question.category },
      { label: "Cognitive level", value: question.cognitive_level },
      { label: "Keywords", value: question.keywords.join(", ") },
      { label: "Source context", value: question.source_context },
      { label: "Assessment criteria", value: question.assessment_criteria },
      { label: "Follow-up potential", value: question.follow_up_potential },
      { label: "Industry relevance", value: question.industry_relevance },
    ].filter((detail) => detail.value?.trim());

    content.push(
      { text: `QUESTION ${index + 1}`, style: "questionLabel" },
      { text: question.question, style: "question" },
      {
        text: [{ text: "Answer: ", bold: true }, question.answer],
        style: "answer",
      },
      ...details.map(
        (detail): Content => ({
          text: [{ text: `${detail.label}: `, bold: true }, detail.value ?? ""],
          style: "detail",
        }),
      ),
      { text: "", margin: [0, 0, 0, 16] },
    );
  });

  const documentDefinition: TDocumentDefinitions = {
    content,
    pageSize: "A4",
    pageMargins: [42, 42, 42, 48],
    footer: (currentPage, pageCount) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: "right",
      fontSize: 9,
      margin: [42, 10, 42, 0],
    }),
    styles: {
      eyebrow: {
        fontSize: 9,
        bold: true,
        margin: [0, 0, 0, 6],
      },
      title: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 20],
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 8],
      },
      questionLabel: {
        fontSize: 9,
        bold: true,
        margin: [0, 6, 0, 4],
      },
      question: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 8],
      },
      answer: { margin: [0, 0, 0, 8] },
      detail: { fontSize: 9, margin: [0, 0, 0, 3] },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.2,
      color: "#000000",
    },
  };
  await downloadPDF(documentDefinition, `question-set-${questionSet._id}.pdf`);
}

interface ExamDetails {
  title: string;
  institution: string;
  studentName: string;
  studentLastName: string;
  studentNumber: string;
  date: string;
  duration: string;
  course: string;
  instructor: string;
}

async function exportExamPDF(questionSet: IQuestionSet, details: ExamDetails) {
  const studentFields = [
    { label: "Student name", value: details.studentName },
    { label: "Student last name", value: details.studentLastName },
    { label: "Student number", value: details.studentNumber },
  ];
  const examFields = [
    { label: "Course", value: details.course },
    { label: "Instructor", value: details.instructor },
    { label: "Exam date", value: details.date },
    { label: "Exam duration", value: details.duration },
  ].filter((field) => field.value.trim());
  const content: Content[] = [
    ...(details.institution.trim()
      ? [{ text: details.institution.trim(), style: "institution" }]
      : []),
    { text: "EXAM", style: "eyebrow" },
    { text: details.title.trim() || questionSet.title, style: "title" },
    ...Array.from(
      { length: Math.ceil(examFields.length / 2) },
      (_, index): Content => ({
        columns: examFields.slice(index * 2, index * 2 + 2).map((field) => ({
          width: "*",
          text: [{ text: `${field.label}: `, bold: true }, field.value.trim()],
        })),
        columnGap: 20,
        margin: [0, 0, 0, 8],
      }),
    ),
    {
      columns: studentFields.map((field) => ({
        width: "*",
        stack: [
          { text: field.label, style: "fieldLabel" },
          { text: field.value.trim() || "____________________" },
        ],
      })),
      columnGap: 16,
      margin: [0, 18, 0, 18],
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 511,
          y2: 0,
          lineWidth: 0.6,
          lineColor: "#999999",
        },
      ],
    },
    { text: "Questions", style: "sectionTitle" },
    ...questionSet.questions.map(
      (question, index): Content => ({
        text: `${index + 1}. ${question.question}`,
        bold: true,
        margin: [0, 0, 0, 90],
      }),
    ),
  ];

  await downloadPDF(
    {
      content,
      pageSize: "A4",
      pageMargins: [42, 42, 42, 48],
      footer: (currentPage, pageCount) => ({
        text: `${currentPage} / ${pageCount}`,
        alignment: "right",
        fontSize: 9,
        margin: [42, 10, 42, 0],
      }),
      styles: {
        institution: {
          fontSize: 11,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        eyebrow: {
          fontSize: 9,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 6],
        },
        title: {
          fontSize: 20,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 20],
        },
        fieldLabel: { fontSize: 9, bold: true, margin: [0, 0, 0, 4] },
        sectionTitle: { fontSize: 12, bold: true, margin: [0, 20, 0, 16] },
      },
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
        lineHeight: 1.2,
        color: "#000000",
      },
    },
    `exam-${questionSet._id}.pdf`,
  );
}

export function QuestionSetDisplay({ _id, onClose }: QuestionSetDisplayProps) {
  const [questionSet, setQuestionSet] = useState<IQuestionSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);

  async function handleExport(
    exporter: (set: IQuestionSet) => void | Promise<void>,
  ) {
    if (!questionSet) {
      toast.error("Question set is not available yet.");
      return false;
    }

    setIsExporting(true);
    try {
      await exporter(questionSet);
      return true;
    } catch (error) {
      console.error("Failed to export question set", error);
      toast.error("Failed to export question set. Please try again.");
      return false;
    } finally {
      setIsExporting(false);
    }
  }

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="-ml-2 w-fit"
              onClick={onClose}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onMouseUp={() => {
                  setExamModalOpen(true);
                }}
              >
                <Download aria-hidden="true" className="size-4" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline">
                    <MoreHorizontal aria-hidden="true" className="size-4" />
                    More options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    disabled={!questionSet || isExporting}
                    onSelect={() => void handleExport(exportAsJSON)}
                  >
                    JSON Format
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!questionSet || isExporting}
                    onSelect={() => void handleExport(exportAsCSV)}
                  >
                    CSV Spreadsheet
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!questionSet || isExporting}
                    onSelect={() => void handleExport(exportAsPDF)}
                  >
                    PDF Document
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!questionSet || isExporting}
                    onSelect={() => setExamModalOpen(true)}
                  >
                    Exam Format
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
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
      {examModalOpen && questionSet && (
        <ExamFormatModal
          isExporting={isExporting}
          onClose={() => setExamModalOpen(false)}
          onGenerate={async (details) => {
            const success = await handleExport((set) =>
              exportExamPDF(set, details),
            );
            if (success) setExamModalOpen(false);
          }}
        />
      )}
    </Dialog>
  );
}

function ExamFormatModal({
  isExporting,
  onClose,
  onGenerate,
}: {
  isExporting: boolean;
  onClose: () => void;
  onGenerate: (details: ExamDetails) => Promise<void>;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onGenerate({
      title: String(data.get("title") ?? ""),
      institution: String(data.get("institution") ?? ""),
      studentName: String(data.get("studentName") ?? ""),
      studentLastName: String(data.get("studentLastName") ?? ""),
      studentNumber: String(data.get("studentNumber") ?? ""),
      date: String(data.get("date") ?? ""),
      duration: String(data.get("duration") ?? ""),
      course: String(data.get("course") ?? ""),
      instructor: String(data.get("instructor") ?? ""),
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Exam Format</DialogTitle>
          <DialogDescription>
            Fill the exam information below to create professional exam
            document, Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 [&_input]:border-foreground/50 [&_input:focus-visible]:border-ring [&_label]:font-bold"
        >
          <div className="flex flex-row gap-2">
            <label htmlFor="exam-title" className="min-w-fit">
              Exam Title*
            </label>
            <Input id="exam-title" name="title" type="text" />
          </div>
          <div className="flex flex-row gap-2">
            <label htmlFor="exam-institution" className="min-w-fit">
              Institution
            </label>
            <Input id="exam-institution" name="institution" type="text" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="exam-studentName">Student Name</label>
              <Input id="exam-studentName" name="studentName" type="text" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="exam-studentLastName">Student Last Name</label>
              <Input
                id="exam-studentLastName"
                name="studentLastName"
                type="text"
              />
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <label htmlFor="exam-studentNumber" className="min-w-fit">
              Student Number
            </label>
            <Input id="exam-studentNumber" name="studentNumber" type="text" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="exam-date">Exam Date*</label>
              <Input id="exam-date" name="date" type="date" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="exam-duration">Exam Duration*</label>
              <Input
                id="exam-duration"
                name="duration"
                type="text"
                placeholder="e.g. 90 minutes"
              />
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <label htmlFor="exam-course" className="min-w-fit">
              Course
            </label>
            <Input id="exam-course" name="course" type="text" />
          </div>
          <div className="flex flex-row gap-2">
            <label htmlFor="exam-instructor" className="min-w-fit">
              Instructor
            </label>
            <Input id="exam-instructor" name="instructor" type="text" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isExporting}>
              {isExporting ? "Generating..." : "Generate Exam PDF"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
