import { useLocalization } from "@/providers/localization-provider";
import { CalendarDays, Hash, Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { IQuestionSet } from "@/models/questionset";

type QuestionSetMetadataProps = Pick<
  IQuestionSet,
  "totalCount" | "createdAt" | "metadata"
>;

export function QuestionSetMetadata({
  totalCount,
  createdAt,
  metadata,
}: QuestionSetMetadataProps) {
  const { language, t } = useLocalization();
  const dateFormatter = new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const date = createdAt ? new Date(createdAt) : null;
  const details = [
    { label: t("totalQuestions"), value: totalCount, icon: Hash },
    {
      label: t("createdAt"),
      value:
        date && !Number.isNaN(date.getTime()) ? (
          <time dateTime={date.toISOString()}>{dateFormatter.format(date)}</time>
        ) : null,
      icon: CalendarDays,
    },
    {
      label: t("aiModel"),
      value: metadata?.aiModel?.trim() || null,
      icon: Info,
    },
  ];

  return (
    <dl
      aria-label={t("questionSetDetails")}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-muted/50 px-4 py-3 text-xs"
    >
      {details.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex min-w-0 items-center gap-2">
          <dt className="flex shrink-0 items-center gap-1.5 font-medium">
            <Icon aria-hidden="true" className="size-3.5 text-muted-foreground" />
            {label}:
          </dt>
          <dd className="min-w-0 wrap-anywhere text-muted-foreground">
            {value ?? t("notAvailable")}
          </dd>
        </div>
      ))}
      {typeof metadata?.ragEnabled === "boolean" && (
        <div className="flex items-center gap-2">
          <dt className="flex items-center text-muted-foreground">
            <Tag aria-hidden="true" className="size-3.5" />
            <span className="sr-only">{t("rag")}</span>
          </dt>
          <dd>
            <Badge
              variant="secondary"
              className={
                metadata.ragEnabled
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : undefined
              }
            >
              {metadata.ragEnabled ? t("ragEnhanced") : t("ragDisabled")}
            </Badge>
          </dd>
        </div>
      )}
    </dl>
  );
}
