import type { CohortResult, UnitInput } from "@/lib/benchmark";
import CohortCharts from "@/components/CohortCharts";
import SummaryTable from "@/components/SummaryTable";

interface Props {
  unit: UnitInput;
  cohort: CohortResult | null | undefined;
}

export default function ProjectSection({ unit, cohort }: Props) {
  if (!unit.project?.trim()) return null;

  if (!cohort || cohort.summary.n === 0) {
    return (
      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-ink">
          Внутри проекта: {unit.project}
        </h2>
        <p className="text-sm text-muted">
          Нет данных по {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms}BR`} в
          проекте «{unit.project}».
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <h2 className="text-sm font-medium text-ink">
        Внутри проекта: {unit.project}
      </h2>
      <SummaryTable rows={[cohort.summary]} />
      <CohortCharts cohorts={[cohort]} unit={unit} />
    </section>
  );
}
