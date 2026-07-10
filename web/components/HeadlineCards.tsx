import type { HeadlineKpis } from "@/lib/benchmark";
import { fmtPct } from "@/lib/format";

interface Props {
  kpis: HeadlineKpis;
}

function Card({
  title,
  value,
  context,
}: {
  title: string;
  value: string;
  context: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-1 text-2xl font-medium text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{context}</p>
    </div>
  );
}

function brLabel(n: number): string {
  return n === 0 ? "Studio" : `${n}BR`;
}

export default function HeadlineCards({ kpis }: Props) {
  const br = brLabel(kpis.bedrooms);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Card
        title="Дисконт цены vs Phuket"
        value={fmtPct(kpis.priceVsPhuketPct)}
        context={`Phuket · ${br} · n=${kpis.phuketN}`}
      />
      <Card
        title="Дисконт цены vs район"
        value={fmtPct(kpis.priceVsDistrictPct)}
        context={`${kpis.districtLabel} · ${br} · n=${kpis.districtN}`}
      />
      <Card
        title="Дисконт $/m² vs Phuket"
        value={fmtPct(kpis.priceSqmVsPhuketPct)}
        context={`Phuket · ${br} · n=${kpis.phuketN}`}
      />
      <Card
        title="Дисконт $/m² vs район"
        value={fmtPct(kpis.priceSqmVsDistrictPct)}
        context={`${kpis.districtLabel} · ${br} · n=${kpis.districtN}`}
      />
      <Card
        title="Листинги в ±15% от цены"
        value={fmtPct(kpis.shareWithinBandPct)}
        context={`${kpis.districtLabel} · ${br} · n=${kpis.districtN}`}
      />
    </div>
  );
}
