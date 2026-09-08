import { normalizeExercise, type Exercise, type OssExercise } from "./types";

export const OSS_BASE_URL =
  process.env.EXERCISEDB_BASE_URL ?? "https://oss.exercisedb.dev";

const FETCH_TIMEOUT_MS = 8000;

/** Fallback lokal bila OSS down — sama dengan 3 exercise bawaan lama. */
export const FALLBACK_EXERCISES: Exercise[] = [
  { id: "pushups", name: "Push-ups", target: "Chest • Triceps", gifUrl: "", bodyPart: "chest" },
  { id: "squats", name: "Squats", target: "Legs • Glutes", gifUrl: "", bodyPart: "legs" },
  { id: "planks", name: "Planks", target: "Core", gifUrl: "", bodyPart: "core" },
];

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetch katalog OSS (server-only). Coba beberapa path karena shape
 * endpoint OSS bisa berbeda antar deploy (/api/v1/exercises lalu /exercises).
 */
export async function fetchOssCatalog(limit = 1500): Promise<Exercise[]> {
  const paths = [
    `/api/v1/exercises?limit=${limit}&offset=0`,
    `/exercises?limit=${limit}&offset=0`,
    `/api/v1/exercises?limit=${limit}`,
  ];
  let lastError: unknown = null;

  for (const p of paths) {
    try {
      const res = await fetchWithTimeout(`${OSS_BASE_URL}${p}`);
      if (!res.ok) {
        lastError = new Error(`OSS ${res.status} untuk ${p}`);
        continue;
      }
      const json: unknown = await res.json();
      const list: OssExercise[] = Array.isArray(json)
        ? json
        : Array.isArray((json as { data?: unknown }).data)
          ? ((json as { data: OssExercise[] }).data)
          : Array.isArray((json as { exercises?: unknown }).exercises)
            ? ((json as { exercises: OssExercise[] }).exercises)
            : [];
      if (list.length === 0) {
        lastError = new Error(`Respons kosong untuk ${p}`);
        continue;
      }
      return list.map((raw, i) => normalizeExercise(raw, i));
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gagal fetch OSS");
}
