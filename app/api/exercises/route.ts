import { NextResponse } from "next/server";
import { FALLBACK_EXERCISES, fetchOssCatalog } from "@/lib/exercisedb/client";
import { sortByName } from "@/lib/exercisedb/search";
import type { Exercise } from "@/lib/exercisedb/types";

export const revalidate = 604800; // 7 hari — cache L1 Next

const CACHE_DAYS = 7;

type Source = "supabase" | "oss" | "fallback";

async function readSupabaseCache(): Promise<Exercise[] | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
    return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const cutoff = new Date(
      Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data, error } = await supabase
      .from("exercise_cache")
      .select("exercise_id,name,target,gif_url,body_part,updated_at")
      .gte("updated_at", cutoff)
      .limit(2000);
    if (error || !data || data.length === 0) return null;
    return data.map((r) => ({
      id: r.exercise_id,
      name: r.name,
      target: r.target ?? "General",
      gifUrl: r.gif_url ?? "",
      bodyPart: r.body_part ?? "",
    }));
  } catch {
    return null;
  }
}

async function writeSupabaseCache(items: Exercise[]): Promise<void> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
      return;
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const rows = items.slice(0, 2000).map((e) => ({
      exercise_id: e.id,
      name: e.name,
      target: e.target,
      gif_url: e.gifUrl,
      body_part: e.bodyPart,
      updated_at: new Date().toISOString(),
    }));
    // Chunk 200 agar tidak melebihi limit payload.
    for (let i = 0; i < rows.length; i += 200) {
      await supabase
        .from("exercise_cache")
        .upsert(rows.slice(i, i + 200), { onConflict: "exercise_id" });
    }
  } catch {
    // Gagal tulis cache tidak boleh menggagalkan respons.
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  // L2: Supabase cache 7 hari (kecuali force refresh).
  if (!forceRefresh) {
    const cached = await readSupabaseCache();
    if (cached) {
      return NextResponse.json(
        { data: sortByName(cached), source: "supabase" as Source, cached: true },
        { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } }
      );
    }
  }

  // L1 miss → fetch OSS.
  try {
    const fresh = sortByName(await fetchOssCatalog());
    // Tulis L2 di background (jangan await terlalu lama).
    void writeSupabaseCache(fresh);
    return NextResponse.json(
      { data: fresh, source: "oss" as Source, cached: false },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=604800" } }
    );
  } catch {
    // Fallback terakhir: list lokal agar UI tetap bisa dipakai + log workout.
    return NextResponse.json(
      { data: FALLBACK_EXERCISES, source: "fallback" as Source, cached: false },
      { status: 200 }
    );
  }
}
