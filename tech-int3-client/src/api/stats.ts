import { http } from "./http";
import type {
  StatsSummary,
  ActivityData,
  DecisionsData,
  CategoriesData,
  StatsPeriod,
} from "../types";

export async function fetchStatsSummary(
  period: StatsPeriod,
  signal?: AbortSignal
): Promise<StatsSummary> {
  const { data } = await http.get<StatsSummary>("/stats/summary", {
    params: { period },
    signal,
  });
  return data;
}

export async function fetchActivityChart(
  period: StatsPeriod,
  signal?: AbortSignal
): Promise<ActivityData[]> {
  const { data } = await http.get<ActivityData[]>("/stats/chart/activity", {
    params: { period },
    signal,
  });
  return data;
}

export async function fetchDecisionsChart(
  period: StatsPeriod,
  signal?: AbortSignal
): Promise<DecisionsData> {
  const { data } = await http.get<DecisionsData>("/stats/chart/decisions", {
    params: { period },
    signal,
  });
  return data;
}

export async function fetchCategoriesChart(
  period: StatsPeriod,
  signal?: AbortSignal
): Promise<CategoriesData> {
  const { data } = await http.get<CategoriesData>("/stats/chart/categories", {
    params: { period },
    signal,
  });
  return data;
}
