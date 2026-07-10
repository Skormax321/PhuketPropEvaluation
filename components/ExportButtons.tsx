"use client";

import type { BenchmarkResult } from "@/lib/benchmark";
import {
  downloadCsv,
  listingsToCsv,
  summaryToCsv,
} from "@/lib/benchmark";

interface Props {
  result: BenchmarkResult;
}

export default function ExportButtons({ result }: Props) {
  const summaries = result.cohorts.map((c) => c.summary);
  const exportCohorts = [
    ...result.cohorts.filter((c) => c.listings.length > 0),
    ...(result.projectCohort && result.projectCohort.listings.length > 0
      ? [result.projectCohort]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          downloadCsv("summary_percentiles.csv", summaryToCsv(summaries))
        }
        className="rounded border border-border px-4 py-2 text-sm text-ink hover:bg-[#fafaf9]"
      >
        Скачать summary.csv
      </button>
      {exportCohorts.map((c) => (
        <button
          key={c.name}
          type="button"
          onClick={() =>
            downloadCsv(`cohort_${c.name}.csv`, listingsToCsv(c.listings))
          }
          className="rounded border border-border px-4 py-2 text-sm text-ink hover:bg-[#fafaf9]"
        >
          cohort_{c.name}.csv
        </button>
      ))}
    </div>
  );
}
