"use client";

import { useEffect, useState } from "react";
import type { Listing, Segment } from "@/lib/benchmark";

export interface DistrictOption {
  district: string;
  count: number;
}

export interface ProjectOption {
  segment: Segment;
  district: string;
  project: string;
  count: number;
}

export interface ListingsData {
  off_plan: Listing[];
  ready: Listing[];
  districts: DistrictOption[];
  projects: ProjectOption[];
}

let cache: ListingsData | null = null;

export async function loadListingsData(): Promise<ListingsData> {
  if (cache) return cache;
  const [offPlan, ready, districts, projects] = await Promise.all([
    fetch("/data/off_plan.json").then((r) => r.json()),
    fetch("/data/ready.json").then((r) => r.json()),
    fetch("/data/districts.json").then((r) => r.json()),
    fetch("/data/projects_index.json").then((r) => r.json()),
  ]);
  cache = { off_plan: offPlan, ready, districts, projects };
  return cache;
}

export function useListingsData() {
  const [data, setData] = useState<ListingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadListingsData()
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function getListingsForSegment(
  data: ListingsData,
  segment: Segment,
): Listing[] {
  return segment === "off_plan" ? data.off_plan : data.ready;
}

export function getProjectsForForm(
  data: ListingsData,
  segment: Segment,
  district: string,
): ProjectOption[] {
  return data.projects.filter(
    (p) => p.segment === segment && p.district === district,
  );
}
