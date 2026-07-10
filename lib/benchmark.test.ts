import {
  buildCohorts,
  buildProjectCohort,
  computeHeadlineKpis,
  percentileBelow,
  runBenchmark,
  shareWithinPriceBand,
  summarizeCohort,
  type Listing,
  type UnitInput,
} from "./benchmark";

function approx(a: number, b: number, tol = 1.5): boolean {
  return Math.abs(a - b) <= tol;
}

const karonListings: Listing[] = [
  { district: "Karon, Phuket Town, Phuket", price_usd: 100000, price_usd_sqm: 3000, area_sqm: 33, bedrooms: 1 },
  { district: "Karon, Phuket Town, Phuket", price_usd: 150000, price_usd_sqm: 4000, area_sqm: 38, bedrooms: 1 },
  { district: "Karon, Phuket Town, Phuket", price_usd: 200000, price_usd_sqm: 5000, area_sqm: 40, bedrooms: 1 },
  { district: "Rawai, Phuket Town, Phuket", price_usd: 180000, price_usd_sqm: 4500, area_sqm: 40, bedrooms: 1 },
];

const unit: UnitInput = {
  priceUsd: 137000,
  areaSqm: 30,
  bedrooms: 1,
  district: "Karon, Phuket Town, Phuket",
  segment: "ready",
};

const levels = buildCohorts(karonListings, unit);
if (levels.karon_1br?.length !== 3) {
  throw new Error(`expected 3 karon rows, got ${levels.karon_1br?.length}`);
}

const karonSummary = summarizeCohort("karon_1br", levels.karon_1br, unit);
if (!approx(karonSummary.pricePctile, 33.3)) {
  throw new Error(`price pctile expected ~33.3, got ${karonSummary.pricePctile}`);
}

const result = runBenchmark(karonListings, unit);
if (result.cohorts.length !== 3) {
  throw new Error(`expected 3 cohorts, got ${result.cohorts.length}`);
}

const phuket = result.cohorts.find((c) => c.name.startsWith("phuket_"));
if (!phuket || phuket.summary.n !== 4) {
  throw new Error("phuket cohort should have 4 listings");
}

if (percentileBelow(5, [1, 2, 3, 4, 5, 6]) !== 66.7) {
  throw new Error("percentileBelow sanity check failed");
}

const bandListings: Listing[] = [
  { district: "Karon, Phuket Town, Phuket", price_usd: 120000, price_usd_sqm: 4000, area_sqm: 30, bedrooms: 1 },
  { district: "Karon, Phuket Town, Phuket", price_usd: 140000, price_usd_sqm: 4500, area_sqm: 31, bedrooms: 1 },
  { district: "Karon, Phuket Town, Phuket", price_usd: 200000, price_usd_sqm: 6000, area_sqm: 33, bedrooms: 1 },
];
if (shareWithinPriceBand(bandListings, 137000) !== 66.7) {
  throw new Error(`shareWithinPriceBand expected 66.7, got ${shareWithinPriceBand(bandListings, 137000)}`);
}

const kpis = computeHeadlineKpis(result);
if (!Number.isFinite(kpis.priceVsPhuketPct)) {
  throw new Error("computeHeadlineKpis should return phuket price discount");
}
if (kpis.districtN !== 3) {
  throw new Error(`districtN expected 3, got ${kpis.districtN}`);
}

const projectListings: Listing[] = [
  ...karonListings.slice(0, 2).map((r) => ({ ...r, project: "Test Tower" })),
  { district: "Karon, Phuket Town, Phuket", price_usd: 160000, price_usd_sqm: 4200, area_sqm: 38, bedrooms: 1, project: "Test Tower" },
];
const unitWithProject: UnitInput = { ...unit, project: "Test Tower" };
const projectCohort = buildProjectCohort(projectListings, unitWithProject);
if (!projectCohort || projectCohort.summary.n !== 3) {
  throw new Error(`project cohort expected 3, got ${projectCohort?.summary.n}`);
}
const resultWithProject = runBenchmark(projectListings, unitWithProject);
if (!resultWithProject.projectCohort || resultWithProject.projectCohort.summary.n !== 3) {
  throw new Error("runBenchmark should attach projectCohort");
}

console.log("benchmark.test.ts: all passed");
