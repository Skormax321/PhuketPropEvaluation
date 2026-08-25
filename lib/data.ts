"use client";

import { useEffect, useState } from "react";
import type { Listing, Market, Segment } from "@/lib/benchmark";

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

const cache = new Map<Market, ListingsData>();

export async function loadListingsData(market: Market): Promise<ListingsData> {
  const hit = cache.get(market);
  if (hit) return hit;
  /** Пусто = данные из `public/data`. Можно вынести их на CDN/внешний хост. */
  const DATA_BASE_URL = (process.env.NEXT_PUBLIC_DATA_BASE_URL ?? "").replace(/\/$/, "");
  const base = `${DATA_BASE_URL}/data/${market}`;
  const [offPlan, ready, districts, projects] = await Promise.all([
    fetch(`${base}/off_plan.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${base}/off_plan.json`);
      return r.json();
    }),
    fetch(`${base}/ready.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${base}/ready.json`);
      return r.json();
    }),
    fetch(`${base}/districts.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${base}/districts.json`);
      return r.json();
    }),
    fetch(`${base}/projects_index.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${base}/projects_index.json`);
      return r.json();
    }),
  ]);
  const data: ListingsData = {
    off_plan: offPlan,
    ready,
    districts,
    projects,
  };
  cache.set(market, data);
  return data;
}

export function useListingsData(market: Market) {
  const [data, setData] = useState<ListingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadListingsData(market)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) {
          setData(null);
          setError(String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [market]);

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
