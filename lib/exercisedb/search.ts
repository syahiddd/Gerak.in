import { normalizeKey, type Exercise } from "./types";

/**
 * Binary search untuk pencarian workout.
 * Prasyarat: `sorted` sudah terurut ascending berdasarkan normalizeKey(name).
 * - Prefix match: O(log n + k) via lowerBound/upperBound.
 * - Query < 2 karakter: kembalikan slice awal (hindari pencarian sia-sia).
 * - Fallback substring linear hanya bila prefix tidak ketemu.
 */

export function sortByName(list: Exercise[]): Exercise[] {
  return [...list].sort((a, b) =>
    normalizeKey(a.name) < normalizeKey(b.name)
      ? -1
      : normalizeKey(a.name) > normalizeKey(b.name)
        ? 1
        : 0
  );
}

function lowerBound(sorted: Exercise[], prefix: string): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (normalizeKey(sorted[mid].name).slice(0, prefix.length) < prefix) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function upperBound(sorted: Exercise[], prefix: string): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (normalizeKey(sorted[mid].name).slice(0, prefix.length) <= prefix) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

export function searchExercises(
  sorted: Exercise[],
  query: string,
  limit = 50
): Exercise[] {
  const q = normalizeKey(query);
  if (!q) return sorted.slice(0, limit);
  if (q.length < 2) {
    // Linear pendek untuk 1 huruf — murah dan lebih relevan.
    return sorted.filter((e) => normalizeKey(e.name).startsWith(q)).slice(0, limit);
  }
  const lo = lowerBound(sorted, q);
  const hi = upperBound(sorted, q);
  if (hi > lo) return sorted.slice(lo, Math.min(hi, lo + limit));
  // Fallback substring bila prefix tidak ketemu (mis. "bench" vs "flat bench").
  return sorted.filter((e) => normalizeKey(e.name).includes(q)).slice(0, limit);
}
