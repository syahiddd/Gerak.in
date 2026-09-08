/** Tipe minimal ExerciseDB V1 OSS — UI hanya pakai name+target+gif. */
export type OssExercise = {
  exerciseId?: string;
  id?: string;
  name: string;
  target?: string;
  targetMuscles?: string | string[];
  bodyParts?: string | string[];
  bodyPart?: string;
  equipments?: string | string[];
  equipment?: string;
  gifUrl?: string;
};

export type Exercise = {
  id: string;
  name: string;
  target: string;
  gifUrl: string;
  bodyPart: string;
};

const FALLBACK_IMAGE = "";

function firstString(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return String(v[0]);
  return "";
}

/** Normalisasi response OSS yang field-nya bervariasi antar versi. */
export function normalizeExercise(raw: OssExercise, index: number): Exercise {
  const id = String(raw.exerciseId ?? raw.id ?? `oss-${index}`);
  const target =
    raw.target ?? firstString(raw.targetMuscles) ?? "General";
  return {
    id,
    name: String(raw.name ?? `Exercise ${index + 1}`),
    target: String(target || "General"),
    gifUrl: String(raw.gifUrl ?? FALLBACK_IMAGE),
    bodyPart: String(
      raw.bodyPart ?? firstString(raw.bodyParts) ?? ""
    ),
  };
}

export function normalizeKey(name: string): string {
  return name.toLowerCase().trim();
}
