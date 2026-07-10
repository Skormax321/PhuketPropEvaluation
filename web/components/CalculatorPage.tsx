"use client";

import { useMemo, useState } from "react";
import BenchmarkForm from "@/components/BenchmarkForm";
import CohortCharts from "@/components/CohortCharts";
import ExportButtons from "@/components/ExportButtons";
import HeadlineCards from "@/components/HeadlineCards";
import ProjectSection from "@/components/ProjectSection";
import SummaryTable from "@/components/SummaryTable";
import { computeHeadlineKpis, runBenchmark, type UnitInput } from "@/lib/benchmark";
import { getListingsForSegment, useListingsData } from "@/lib/data";

export default function CalculatorPage() {
  const { data, loading, error } = useListingsData();
  const [unit, setUnit] = useState<UnitInput | null>(null);

  const result = useMemo(() => {
    if (!data || !unit) return null;
    const listings = getListingsForSegment(data, unit.segment);
    return runBenchmark(listings, unit);
  }, [data, unit]);

  const kpis = useMemo(
    () => (result ? computeHeadlineKpis(result) : null),
    [result],
  );

  if (loading) {
    return <p className="text-sm text-muted">Загрузка данных рынка…</p>;
  }
  if (error || !data) {
    return (
      <p className="text-sm text-red-700">
        Ошибка загрузки данных: {error ?? "unknown"}
      </p>
    );
  }

  return (
    <div className="grid gap-8">
      <BenchmarkForm
        districts={data.districts}
        projects={data.projects}
        onSubmit={setUnit}
        disabled={loading}
      />

      {result && kpis && (
        <section className="grid gap-6">
          <div>
            <h2 className="mb-3 text-sm font-medium text-ink">Ключевые метрики</h2>
            <HeadlineCards kpis={kpis} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-ink">Сводка</h2>
            <SummaryTable rows={result.cohorts.map((c) => c.summary)} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-ink">Графики</h2>
            <CohortCharts cohorts={result.cohorts} unit={result.unit} />
          </div>

          <ProjectSection unit={result.unit} cohort={result.projectCohort} />

          <div>
            <h2 className="mb-3 text-sm font-medium text-ink">Выгрузки</h2>
            <ExportButtons result={result} />
          </div>
        </section>
      )}
    </div>
  );
}
