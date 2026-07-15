"use client";

import { useMemo, useState } from "react";
import type { Segment, UnitInput } from "@/lib/benchmark";
import type { DistrictOption, ProjectOption } from "@/lib/data";

export interface BenchmarkFormValues {
  priceUsd: string;
  originalPriceUsd: string;
  areaSqm: string;
  bedrooms: string;
  district: string;
  segment: Segment;
  project: string;
}

interface Props {
  districts: DistrictOption[];
  projects: ProjectOption[];
  initial?: Partial<BenchmarkFormValues>;
  onSubmit: (unit: UnitInput) => void;
  disabled?: boolean;
}

const defaultValues: BenchmarkFormValues = {
  priceUsd: "137000",
  originalPriceUsd: "",
  areaSqm: "30",
  bedrooms: "1",
  district: "Karon, Phuket Town, Phuket",
  segment: "ready",
  project: "",
};

export function parseForm(values: BenchmarkFormValues): UnitInput | null {
  const priceUsd = Number(values.priceUsd);
  const areaSqm = Number(values.areaSqm);
  const bedrooms = Number(values.bedrooms);
  const originalRaw = values.originalPriceUsd.trim();
  const originalPriceUsd = originalRaw ? Number(originalRaw) : undefined;
  const projectRaw = values.project.trim();

  if (!values.district) return null;
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return null;
  if (!Number.isFinite(bedrooms) || bedrooms < 0) return null;
  if (originalPriceUsd != null && (!Number.isFinite(originalPriceUsd) || originalPriceUsd <= 0)) {
    return null;
  }

  return {
    priceUsd,
    originalPriceUsd,
    areaSqm,
    bedrooms,
    district: values.district,
    segment: values.segment,
    project: projectRaw || undefined,
  };
}

export default function BenchmarkForm({
  districts,
  projects,
  initial,
  onSubmit,
  disabled,
}: Props) {
  const [values, setValues] = useState<BenchmarkFormValues>({
    ...defaultValues,
    ...initial,
    district: initial?.district ?? districts[0]?.district ?? "",
  });

  const projectOptions = useMemo(
    () =>
      projects.filter(
        (p) => p.segment === values.segment && p.district === values.district,
      ),
    [projects, values.segment, values.district],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unit = parseForm(values);
    if (unit) onSubmit(unit);
  };

  const set = (key: keyof BenchmarkFormValues, v: string) =>
    setValues((prev) => {
      const next = { ...prev, [key]: v };
      if (key === "district" || key === "segment") {
        const valid = projects.some(
          (p) =>
            p.segment === (key === "segment" ? (v as Segment) : next.segment) &&
            p.district === (key === "district" ? v : next.district) &&
            p.project === next.project,
        );
        if (!valid) next.project = "";
      }
      return next;
    });

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-border p-5 bg-white"
    >
      <h2 className="text-sm font-medium text-ink">Параметры юнита</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Цена сейчас, $</span>
          <input
            type="number"
            min={1}
            required
            value={values.priceUsd}
            onChange={(e) => set("priceUsd", e.target.value)}
            className="rounded border border-border px-3 py-2 text-ink"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Оригинальная цена, $ (опционально)</span>
          <input
            type="number"
            min={1}
            value={values.originalPriceUsd}
            onChange={(e) => set("originalPriceUsd", e.target.value)}
            className="rounded border border-border px-3 py-2 text-ink"
            placeholder="165000"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Площадь, m²</span>
          <input
            type="number"
            min={1}
            step={0.1}
            required
            value={values.areaSqm}
            onChange={(e) => set("areaSqm", e.target.value)}
            className="rounded border border-border px-3 py-2 text-ink"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Спальни</span>
          <select
            value={values.bedrooms}
            onChange={(e) => set("bedrooms", e.target.value)}
            className="rounded border border-border px-3 py-2 text-ink"
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "Studio (0)" : n}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Рынок</span>
          <select
            value={values.segment}
            onChange={(e) => set("segment", e.target.value as Segment)}
            className="rounded border border-border px-3 py-2 text-ink"
          >
            <option value="ready">Ready (вторичка)</option>
            <option value="off_plan">Off-plan</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-1">
          <span className="text-muted">Район</span>
          <select
            required
            value={values.district}
            onChange={(e) => set("district", e.target.value)}
            className="rounded border border-border px-3 py-2 text-ink"
          >
            {districts.map((d) => (
              <option key={d.district} value={d.district}>
                {d.district.split(",")[0]} ({d.count})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-muted">Проект (опц.)</span>
          <select
            value={values.project}
            onChange={(e) => set("project", e.target.value)}
            className="rounded border border-border px-3 py-2 text-ink"
          >
            <option value="">— не выбран —</option>
            {projectOptions.map((p) => (
              <option key={p.project} value={p.project}>
                {p.project} ({p.count})
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="w-fit rounded bg-ink px-5 py-2 text-sm text-white disabled:opacity-50"
      >
        Сравнить с рынком
      </button>
    </form>
  );
}
