import { http } from "./http";
import type { AdsListResponse, Advertisement, AdStatus } from "../types";

export type AdsListParams = {
  page?: number;
  limit?: number;
  status?: AdStatus[];
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "createdAt" | "price" | "priority";
  sortOrder?: "asc" | "desc";
};

type ModerationResponse = { message: string; ad: Advertisement };

export async function fetchAds(
  params: AdsListParams,
  signal?: AbortSignal
): Promise<AdsListResponse> {
  const { data } = await http.get<AdsListResponse>("/ads", { params, signal });
  return data;
}

export async function fetchAd(
  id: number | string,
  signal?: AbortSignal
): Promise<Advertisement> {
  const { data } = await http.get<Advertisement>(`/ads/${id}`, { signal });
  return data;
}

export async function approveAd(id: number | string): Promise<Advertisement> {
  const { data } = await http.post<ModerationResponse>(`/ads/${id}/approve`);
  return data.ad;
}

export async function rejectAd(
  id: number | string,
  payload: { reason: string; comment?: string }
): Promise<Advertisement> {
  const { data } = await http.post<ModerationResponse>(
    `/ads/${id}/reject`,
    payload
  );
  return data.ad;
}

export async function requestChangesAd(
  id: number | string,
  payload: { reason: string; comment?: string }
): Promise<Advertisement> {
  const { data } = await http.post<ModerationResponse>(
    `/ads/${id}/request-changes`,
    payload
  );
  return data.ad;
}
