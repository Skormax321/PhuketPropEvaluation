"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { CohortResult, UnitInput } from "@/lib/benchmark";
import { buildHistogram, median, unitPriceSqm } from "@/lib/benchmark";
import { COLOR_BAR, COLOR_MEDIAN, COLOR_UNIT, COLOR_UNIT_ALT } from "@/lib/chartTheme";
import { formatMetric } from "@/lib/format";

interface MetricSpec {
  key: "price_usd" | "area_sqm" | "price_usd_sqm";
  label: string;
  unitVal: (unit: UnitInput) => number;
  format: "money" | "moneySqm" | "plain" | "space";
}

const METRICS: MetricSpec[] = [
  { key: "price_usd", label: "Цена, $", unitVal: (u) => u.priceUsd, format: "money" },
  { key: "area_sqm", label: "Площадь, m²", unitVal: (u) => u.areaSqm, format: "plain" },
  {
    key: "price_usd_sqm",
    label: "$/m²",
    unitVal: (u) => unitPriceSqm(u),
    format: "moneySqm",
  },
];

const TICK_FONT = { fontSize: 9, fill: "#6b6960", fontFamily: "var(--font-golos)" };

function MiniHist({
  title,
  values,
  unitVal,
  originalVal,
  format,
}: {
  title: string;
  values: number[];
  unitVal: number;
  originalVal?: number;
  format: "money" | "moneySqm" | "plain" | "space";
}) {
  const extra = originalVal != null ? [originalVal] : [];
  const { bins, domain } = buildHistogram(values, unitVal, extra);
  const med = median(values);
  const data = bins.map((b) => ({ name: b.label, count: b.count }));

  const binIndex = (v: number) => {
    for (let i = 0; i < bins.length; i++) {
      if (v >= bins[i].start && v < bins[i].end) return i;
    }
    return v <= bins[0].start ? 0 : bins.length - 1;
  };
  const unitBin = data[binIndex(unitVal)]?.name;
  const origBin =
    originalVal != null ? data[binIndex(originalVal)]?.name : undefined;
  const medBin = data[binIndex(med)]?.name;

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-xs text-muted">{title}</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f0eeea" />
          <XAxis
            dataKey="name"
            tick={TICK_FONT}
            axisLine={{ stroke: "#d8d6d0" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Bar dataKey="count" fill={COLOR_BAR} radius={[2, 2, 0, 0]} />
          {unitBin && (
            <ReferenceLine x={unitBin} stroke={COLOR_UNIT} strokeWidth={2} />
          )}
          {origBin && (
            <ReferenceLine x={origBin} stroke={COLOR_UNIT_ALT} strokeWidth={2} />
          )}
          {medBin && (
            <ReferenceLine
              x={medBin}
              stroke={COLOR_MEDIAN}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted">
        <span>Юнит: {formatMetric(unitVal, format)}</span>
        {originalVal != null && (
          <span>Оригинал: {formatMetric(originalVal, format)}</span>
        )}
        <span>Медиана: {formatMetric(med, format)}</span>
        <span>
          {formatMetric(domain[0], format === "money" ? "space" : format)}–
          {formatMetric(domain[1], format === "money" ? "space" : format)}
        </span>
      </div>
    </div>
  );
}

function CohortBlock({ cohort, unit }: { cohort: CohortResult; unit: UnitInput }) {
  if (cohort.listings.length === 0) return null;
  const orig = unit.originalPriceUsd;

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-3 text-sm font-medium text-ink">
        {cohort.label} · n={cohort.summary.n}
      </h3>
      <div className="flex flex-col gap-4 lg:flex-row">
        {METRICS.map((m) => {
          const values = cohort.listings.map((r) => r[m.key]);
          const unitVal = m.unitVal(unit);
          const originalVal =
            orig != null && m.key === "price_usd"
              ? orig
              : orig != null && m.key === "price_usd_sqm"
                ? orig / unit.areaSqm
                : undefined;
          return (
            <MiniHist
              key={m.key}
              title={m.label}
              values={values}
              unitVal={unitVal}
              originalVal={originalVal}
              format={m.format}
            />
          );
        })}
      </div>
      <div className="mt-2 flex gap-4 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 bg-ink" /> Ваша цена
        </span>
        {orig != null && (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 bg-median" /> Оригинал
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 border-t border-dashed border-median" />{" "}
          Медиана
        </span>
      </div>
    </div>
  );
}

interface Props {
  cohorts: CohortResult[];
  unit: UnitInput;
}

export default function CohortCharts({ cohorts, unit }: Props) {
  const visible = cohorts.filter((c) => c.listings.length > 0);
  return (
    <div className="grid gap-4">
      {visible.map((c) => (
        <CohortBlock key={c.name} cohort={c} unit={unit} />
      ))}
    </div>
  );
}
