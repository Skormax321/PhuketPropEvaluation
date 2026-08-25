"use client";

import { useEffect, useId, useState } from "react";
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
  open,
  onToggle,
}: {
  title: string;
  value: string;
  context: string;
  description: string;
  showBandScale?: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const descriptionId = useId();

  return (
    <div
      className={`relative min-w-0 overflow-visible rounded-lg border border-border bg-white p-3 sm:p-4 ${
        open ? "z-50" : "z-10"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 break-words text-xs text-muted">{title}</p>
        <button
          type="button"
          data-kpi-help=""
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] text-muted hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-expanded={open}
          aria-controls={descriptionId}
          aria-label={`Пояснение: ${title}`}
          onClick={onToggle}
        >
          ?
        </button>
      </div>

      <p className="mt-1 break-words text-xl font-medium text-ink sm:text-2xl">{value}</p>
      <p className="mt-1 break-words text-[10px] text-muted sm:text-[11px]">{context}</p>
      {showBandScale && <PriceBandScale />}

      {open && (
        <div
          id={descriptionId}
          role="tooltip"
          className="mt-3 rounded-md border border-border bg-white p-3 text-xs leading-relaxed text-ink shadow-sm sm:absolute sm:left-0 sm:right-0 sm:top-[calc(100%-0.5rem)] sm:z-20 sm:mt-2 sm:w-auto sm:max-w-none"
        >
          {description}
        </div>
      )}
    </div>
  );
}

export default function HeadlineCards({ kpis }: Props) {
  const br = brLabel(kpis.bedrooms);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!openId) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[data-kpi-help]")) return;
      setOpenId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openId]);

  const cards: CardConfig[] = [
    {
      id: "price-market",
      title: `Цена vs ${kpis.marketLabel}`,
      value: fmtPct(kpis.priceVsMarketPct, true),
      context: `${kpis.marketLabel} · ${br} · выборка: ${kpis.marketN}`,
      description: `Насколько цена юнита отличается от медианной цены всех объявлений с соответствующей планировкой на рынке ${kpis.marketLabel}.`,
    },
    {
      id: "price-district",
      title: "Цена vs район",
      value: fmtPct(kpis.priceVsDistrictPct, true),
      context: `${kpis.districtLabel} · ${br} · выборка: ${kpis.districtN}`,
      description:
        "Насколько цена юнита отличается от медианной цены всех объявлений с соответствующей планировкой в выбранном районе.",
    },
    {
      id: "sqm-market",
      title: `$/m² vs ${kpis.marketLabel}`,
      value: fmtPct(kpis.priceSqmVsMarketPct, true),
      context: `${kpis.marketLabel} · ${br} · выборка: ${kpis.marketN}`,
      description: `Насколько цена квадратного метра юнита отличается от медианной цены квадратного метра всех объявлений с соответствующей планировкой на рынке ${kpis.marketLabel}.`,
    },
    {
      id: "sqm-district",
      title: "$/m² vs район",
      value: fmtPct(kpis.priceSqmVsDistrictPct, true),
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
    <div className="grid min-w-0 gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card
          key={card.id}
          title={card.title}
          value={card.value}
          context={card.context}
          description={card.description}
          showBandScale={card.showBandScale}
          open={openId === card.id}
          onToggle={() =>
            setOpenId((prev) => (prev === card.id ? null : card.id))
          }
        />
      ))}
    </div>
  );
}
