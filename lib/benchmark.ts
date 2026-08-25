export type Segment = "off_plan" | "ready";
export type Market = "phuket" | "pattaya";

export const MARKET_LABELS: Record<Market, string> = {
  phuket: "Пхукет",
  pattaya: "Паттайя",
};

export interface Listing {
  district: string;
  price_usd: number;
  price_usd_sqm: number;
  area_sqm: number;
  bedrooms: number;
  project?: string;
}

export interface UnitInput {
  priceUsd: number;
  originalPriceUsd?: number;
  areaSqm: number;
  bedrooms: number;
  district: string;
  segment: Segment;
  market: Market;
  project?: string;
}

export interface CohortSummary {
  cohort: string;
  label: string;
  n: number;
  unitPriceUsd: number;
  unitAreaSqm: number;
  unitPriceUsdSqm: number;
  cohortMedianPriceUsd: number;
  cohortMedianAreaSqm: number;
  cohortMedianPriceUsdSqm: number;
  pricePctile: number;
  areaPctile: number;
  priceSqmPctile: number;
  priceVsMedianPct: number;
  areaVsMedianPct: number;
  priceSqmVsMedianPct: number;
  originalPriceUsd?: number;
  originalPricePctile?: number;
  originalPriceSqmPctile?: number;
}

export interface CohortResult {
  name: string;
  label: string;
  listings: Listing[];
  summary: CohortSummary;
}

export interface BenchmarkResult {
  unit: UnitInput;
  cohorts: CohortResult[];
  projectCohort?: CohortResult | null;
}

export interface HeadlineKpis {
  priceVsMarketPct: number;
  priceVsDistrictPct: number;
  priceSqmVsMarketPct: number;
  priceSqmVsDistrictPct: number;
  shareWithinBandPct: number;
  marketN: number;
  districtN: number;
  marketLabel: string;
  districtLabel: string;
  bedrooms: number;
}

const PCT_TRIM: [number, number] = [0.03, 0.97];

export function districtSlug(district: string): string {
  return district.split(",")[0].trim().toLowerCase().replace(/\s+/g, "_");
}

export function districtShort(district: string): string {
  return district.split(",")[0].trim();
}

export function projectSlug(project: string): string {
  return project.trim().toLowerCase().replace(/\s+/g, "_");
}

export function unitPriceSqm(unit: UnitInput): number {
  return unit.priceUsd / unit.areaSqm;
}

export function percentileBelow(value: number, series: number[]): number {
  const s = series.filter((x) => Number.isFinite(x));
  if (s.length === 0) return NaN;
  const below = s.filter((x) => x < value).length;
  return Math.round((below / s.length) * 1000) / 10;
}

export function median(values: number[]): number {
  const s = [...values].filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (s.length === 0) return NaN;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export function shareWithinPriceBand(
  listings: Listing[],
  unitPrice: number,
  band = 0.15,
): number {
  if (listings.length === 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return NaN;
  }
  const lo = unitPrice * (1 - band);
  const hi = unitPrice * (1 + band);
  const within = listings.filter(
    (r) => r.price_usd >= lo && r.price_usd <= hi,
  ).length;
  return Math.round((within / listings.length) * 1000) / 10;
}

export function trimRange(series: number[], unitVal: number): [number, number] {
  const s = series.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (s.length === 0) return [unitVal * 0.9, unitVal * 1.1];
  const loIdx = Math.floor(s.length * PCT_TRIM[0]);
  const hiIdx = Math.min(s.length - 1, Math.ceil(s.length * PCT_TRIM[1]) - 1);
  let lo = s[loIdx];
  let hi = s[hiIdx];
  lo = Math.min(lo, unitVal);
  hi = Math.max(hi, unitVal);
  const pad = (hi - lo) * 0.06 || 1;
  return [lo - pad, hi + pad];
}

export function cohortLabels(name: string): string {
  const marketMatch = name.match(
    /^(phuket|pattaya)_(off_plan|ready)_(\d+)br$/,
  );
  if (marketMatch) {
    const label = MARKET_LABELS[marketMatch[1] as Market];
    const seg = marketMatch[2] === "off_plan" ? "off-plan" : "ready";
    return `Весь ${label} (${seg})`;
  }
  if (name.includes("_project_")) {
    const slug = name.replace(/_project_\d+br$/, "").replace(/_/g, " ");
    const br = name.match(/(\d+)br$/)?.[1];
    return br ? `${slug}, ${br}BR` : slug;
  }
  if (name.endsWith("_compact_25_35")) {
    const base = name.replace(/_compact_25_35$/, "").replace(/_/g, " ");
    return `${base}, 25–35 m²`;
  }
  if (name.endsWith("br")) {
    return name.replace(/_/g, " ").replace(/(\d)br$/, "$1BR");
  }
  return name.replace(/_/g, " ");
}

export function buildCohorts(
  listings: Listing[],
  unit: UnitInput,
): Record<string, Listing[]> {
  const br = unit.bedrooms;
  const suffix = `${br}br`;
  const segTag = unit.segment;
  const market = unit.market;
  const base = listings.filter((r) => r.bedrooms === br);
  const levels: Record<string, Listing[]> = {
    [`${market}_${segTag}_${suffix}`]: base,
  };

  const districtKey = districtShort(unit.district);
  const inDistrict = base.filter((r) => r.district.includes(districtKey));
  const dslug = districtSlug(unit.district);
  levels[`${dslug}_${suffix}`] = inDistrict;
  levels[`${dslug}_${suffix}_compact_25_35`] = inDistrict.filter(
    (r) => r.area_sqm >= 25 && r.area_sqm <= 35,
  );
  return levels;
}

export function buildProjectCohort(
  listings: Listing[],
  unit: UnitInput,
): CohortResult | null {
  if (!unit.project?.trim()) return null;
  const br = unit.bedrooms;
  const suffix = `${br}br`;
  const pslug = projectSlug(unit.project);
  const name = `${pslug}_project_${suffix}`;
  const rows = listings.filter(
    (r) => r.bedrooms === br && r.project === unit.project,
  );
  const summary = summarizeCohort(name, rows, unit);
  summary.label = `${unit.project}, ${suffix.replace(/br$/, "BR")}`;
  return {
    name,
    label: cohortLabels(name),
    listings: rows,
    summary,
  };
}

export function summarizeCohort(
  name: string,
  cohort: Listing[],
  unit: UnitInput,
): CohortSummary {
  const label = cohortLabels(name);
  if (cohort.length === 0) {
    return {
      cohort: name,
      label,
      n: 0,
      unitPriceUsd: unit.priceUsd,
      unitAreaSqm: unit.areaSqm,
      unitPriceUsdSqm: unitPriceSqm(unit),
      cohortMedianPriceUsd: NaN,
      cohortMedianAreaSqm: NaN,
      cohortMedianPriceUsdSqm: NaN,
      pricePctile: NaN,
      areaPctile: NaN,
      priceSqmPctile: NaN,
      priceVsMedianPct: NaN,
      areaVsMedianPct: NaN,
      priceSqmVsMedianPct: NaN,
    };
  }

  const prices = cohort.map((r) => r.price_usd);
  const areas = cohort.map((r) => r.area_sqm);
  const psqm = cohort.map((r) => r.price_usd_sqm);
  const medPrice = median(prices);
  const medArea = median(areas);
  const medPsqm = median(psqm);
  const p = unit.priceUsd;
  const a = unit.areaSqm;
  const ps = unitPriceSqm(unit);

  const row: CohortSummary = {
    cohort: name,
    label,
    n: cohort.length,
    unitPriceUsd: p,
    unitAreaSqm: a,
    unitPriceUsdSqm: Math.round(ps),
    cohortMedianPriceUsd: medPrice,
    cohortMedianAreaSqm: medArea,
    cohortMedianPriceUsdSqm: medPsqm,
    pricePctile: percentileBelow(p, prices),
    areaPctile: percentileBelow(a, areas),
    priceSqmPctile: percentileBelow(ps, psqm),
    priceVsMedianPct: Math.round((p / medPrice - 1) * 1000) / 10,
    areaVsMedianPct: Math.round((a / medArea - 1) * 1000) / 10,
    priceSqmVsMedianPct: Math.round((ps / medPsqm - 1) * 1000) / 10,
  };

  if (unit.originalPriceUsd != null && unit.originalPriceUsd > 0) {
    row.originalPriceUsd = unit.originalPriceUsd;
    row.originalPricePctile = percentileBelow(unit.originalPriceUsd, prices);
    row.originalPriceSqmPctile = percentileBelow(
      unit.originalPriceUsd / a,
      psqm,
    );
  }
  return row;
}

export function computeHeadlineKpis(result: BenchmarkResult): HeadlineKpis {
  const { unit, cohorts } = result;
  const suffix = `${unit.bedrooms}br`;
  const dslug = districtSlug(unit.district);
  const marketCohort = cohorts.find(
    (c) => c.name === `${unit.market}_${unit.segment}_${suffix}`,
  );
  const district = cohorts.find((c) => c.name === `${dslug}_${suffix}`);

  const marketSummary = marketCohort?.summary;
  const districtSummary = district?.summary;
  const districtListings = district?.listings ?? [];

  return {
    priceVsMarketPct: marketSummary?.priceVsMedianPct ?? NaN,
    priceVsDistrictPct: districtSummary?.priceVsMedianPct ?? NaN,
    priceSqmVsMarketPct: marketSummary?.priceSqmVsMedianPct ?? NaN,
    priceSqmVsDistrictPct: districtSummary?.priceSqmVsMedianPct ?? NaN,
    shareWithinBandPct: shareWithinPriceBand(districtListings, unit.priceUsd),
    marketN: marketSummary?.n ?? 0,
    districtN: districtSummary?.n ?? 0,
    marketLabel: MARKET_LABELS[unit.market],
    districtLabel: districtShort(unit.district),
    bedrooms: unit.bedrooms,
  };
}

export function runBenchmark(
  listings: Listing[],
  unit: UnitInput,
): BenchmarkResult {
  const levels = buildCohorts(listings, unit);
  const cohorts: CohortResult[] = Object.entries(levels).map(([name, rows]) => ({
    name,
    label: cohortLabels(name),
    listings: rows,
    summary: summarizeCohort(name, rows, unit),
  }));
  const projectCohort = buildProjectCohort(listings, unit);
  return { unit, cohorts, projectCohort };
}

export interface HistogramBin {
  start: number;
  end: number;
  count: number;
  label: string;
}

export function buildHistogram(
  values: number[],
  unitVal: number,
  extraVals: number[] = [],
  bins = 12,
): { bins: HistogramBin[]; domain: [number, number] } {
  const allForTrim = [unitVal, ...extraVals];
  let [lo, hi] = trimRange(values, unitVal);
  for (const v of allForTrim) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  const pad = (hi - lo) * 0.06 || 1;
  lo -= pad;
  hi += pad;
  const filtered = values.filter((v) => v >= lo && v <= hi);
  const step = (hi - lo) / bins || 1;
  const counts = Array.from({ length: bins }, () => 0);
  for (const v of filtered) {
    let idx = Math.floor((v - lo) / step);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }
  const histBins: HistogramBin[] = counts.map((count, i) => {
    const start = lo + i * step;
    const end = start + step;
    return {
      start,
      end,
      count,
      label: `${Math.round(start)}`,
    };
  });
  return { bins: histBins, domain: [lo, hi] };
}

export function summaryToCsv(rows: CohortSummary[]): string {
  const header = [
    "cohort",
    "n",
    "unit_price_usd",
    "unit_area_sqm",
    "unit_price_usd_sqm",
    "cohort_median_price_usd",
    "cohort_median_area_sqm",
    "cohort_median_price_usd_sqm",
    "price_pctile",
    "area_pctile",
    "price_sqm_pctile",
    "price_vs_median_pct",
    "area_vs_median_pct",
    "price_sqm_vs_median_pct",
    "original_price_usd",
    "original_price_pctile",
    "original_price_sqm_pctile",
  ];
  const lines = rows
    .filter((r) => r.n > 0)
    .map((r) =>
      [
        r.cohort,
        r.n,
        r.unitPriceUsd,
        r.unitAreaSqm,
        r.unitPriceUsdSqm,
        Math.round(r.cohortMedianPriceUsd),
        Math.round(r.cohortMedianAreaSqm * 10) / 10,
        Math.round(r.cohortMedianPriceUsdSqm),
        r.pricePctile,
        r.areaPctile,
        r.priceSqmPctile,
        r.priceVsMedianPct,
        r.areaVsMedianPct,
        r.priceSqmVsMedianPct,
        r.originalPriceUsd ?? "",
        r.originalPricePctile ?? "",
        r.originalPriceSqmPctile ?? "",
      ].join(","),
    );
  return [header.join(","), ...lines].join("\n");
}

export function listingsToCsv(listings: Listing[]): string {
  const hasProject = listings.some((r) => r.project);
  const header = hasProject
    ? "district,project,price_usd,price_usd_sqm,area_sqm,bedrooms"
    : "district,price_usd,price_usd_sqm,area_sqm,bedrooms";
  const lines = listings.map((r) => {
    const base = [
      r.district,
      r.price_usd,
      r.price_usd_sqm,
      r.area_sqm,
      r.bedrooms,
    ];
    if (hasProject) {
      return [r.district, r.project ?? "", ...base.slice(1)].join(",");
    }
    return base.join(",");
  });
  return [header, ...lines].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
