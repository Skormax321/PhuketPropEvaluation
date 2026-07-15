"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { HeadlineKpis } from "@/lib/benchmark";
import { fmtPct } from "@/lib/format";

interface Props {
  kpis: HeadlineKpis;
}

interface CardConfig {
  id: string;
  title: string;
  value: string;
  context: string;
  description: string;
  showBandScale?: boolean;
}

function brLabel(n: number): string {
  return n === 0 ? "Studio" : `${n}BR`;
}

function PriceBandScale() {
  return (
    <div className="mt-3" aria-hidden="true">
      <div className="relative h-2.5 rounded-full bg-[#eceae4]">
        <div className="absolute inset-y-0 left-[17.5%] right-[17.5%] rounded-full bg-[#c9cfd2]" />
        <div className="absolute left-1/2 top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted">
        <span>−15%</span>
        <span>Цена юнита</span>
        <span>+15%</span>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  context,
  description,
  showBandScale,
}: {
  title: string;
  value: string;
  context: string;
  description: string;
  showBandScale?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative z-10 overflow-visible rounded-lg border border-border bg-white p-4"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted">{title}</p>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] text-muted hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-expanded={open}
          aria-controls={descriptionId}
          aria-label={`Пояснение: ${title}`}
          onClick={() => setOpen((prev) => !prev)}
          onFocus={() => setOpen(true)}
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget as Node)) {
              setOpen(false);
            }
          }}
        >
          ?
        </button>
      </div>

      <p className="mt-1 text-2xl font-medium text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{context}</p>
      {showBandScale && <PriceBandScale />}

      {open && (
        <div
          id={descriptionId}
          role="tooltip"
          className="absolute left-0 right-0 top-[calc(100%-0.5rem)] z-20 mt-2 rounded-md border border-border bg-white p-3 text-xs leading-relaxed text-ink shadow-sm"
        >
          {description}
        </div>
      )}
    </div>
  );
}

export default function HeadlineCards({ kpis }: Props) {
  const br = brLabel(kpis.bedrooms);

  const cards: CardConfig[] = [
    {
      id: "price-phuket",
      title: "Дисконт цены vs Phuket",
      value: fmtPct(kpis.priceVsPhuketPct),
      context: `Phuket · ${br} · выборка: ${kpis.phuketN}`,
      description:
        "Насколько цена юнита отличается от медианной цены всех объявлений с соответствующей планировкой на рынке Пхукета.",
    },
    {
      id: "price-district",
      title: "Дисконт цены vs район",
      value: fmtPct(kpis.priceVsDistrictPct),
      context: `${kpis.districtLabel} · ${br} · выборка: ${kpis.districtN}`,
      description:
        "Насколько цена юнита отличается от медианной цены всех объявлений с соответствующей планировкой в выбранном районе.",
    },
    {
      id: "sqm-phuket",
      title: "Дисконт $/m² vs Phuket",
      value: fmtPct(kpis.priceSqmVsPhuketPct),
      context: `Phuket · ${br} · выборка: ${kpis.phuketN}`,
      description:
        "Насколько цена квадратного метра юнита отличается от медианной цены квадратного метра всех объявлений с соответствующей планировкой на рынке Пхукета.",
    },
    {
      id: "sqm-district",
      title: "Дисконт $/m² vs район",
      value: fmtPct(kpis.priceSqmVsDistrictPct),
      context: `${kpis.districtLabel} · ${br} · выборка: ${kpis.districtN}`,
      description:
        "Насколько цена квадратного метра юнита отличается от медианной цены квадратного метра всех объявлений с соответствующей планировкой в выбранном районе.",
    },
    {
      id: "band",
      title: "Листинги в ±15% от цены",
      value: fmtPct(kpis.shareWithinBandPct),
      context: `${kpis.districtLabel} · ${br} · выборка: ${kpis.districtN}`,
      description:
        "Доля объявлений в выбранном районе, цена которых находится в диапазоне ±15% от цены юнита.",
      showBandScale: true,
    },
  ];

  return (
    <div className="grid gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card
          key={card.id}
          title={card.title}
          value={card.value}
          context={card.context}
          description={card.description}
          showBandScale={card.showBandScale}
        />
      ))}
    </div>
  );
}
