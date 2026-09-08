"use client";

import type { Exercise } from "./types";

const STORAGE_KEY = "gerak:exercises:v1";
export const FRONTEND_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

type Cached = { savedAt: number; data: Exercise[] };

export function readFrontendCache(): Exercise[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (!Array.isArray(parsed.data)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function isFrontendCacheStale(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as Cached;
    return Date.now() - parsed.savedAt > FRONTEND_TTL_MS;
  } catch {
    return true;
  }
}

export function writeFrontendCache(data: Exercise[]): void {
  try {
    const payload: Cached = { savedAt: Date.now(), data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage penuh/private mode — abaikan, app tetap jalan via network.
  }
}

export function clearFrontendCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // abaikan
  }
}
