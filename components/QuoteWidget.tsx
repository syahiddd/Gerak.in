"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import { createClient } from "@/lib/supabase/client";

const FALLBACK_QUOTES = [
  "Push yourself, because no one else is going to do it for you.",
  "The body achieves what the mind believes.",
  "Sweat is just fat crying.",
  "Small steps every day.",
  "Discipline > motivation.",
  "You don't have to be extreme, just consistent.",
  "Your only competition is who you were yesterday.",
];

export default function QuoteWidget() {
  const [quotes, setQuotes] = useState<string[]>(FALLBACK_QUOTES);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
      return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("quotes")
        .select("text")
        .order("id")
        .limit(7);
      if (data && data.length > 0) setQuotes(data.map((q) => q.text));
    })();
  }, []);

  const quote = useMemo(() => {
    const start = new Date(new Date().getFullYear(), 0, 0).getTime();
    const dayOfYear = Math.floor((Date.now() - start) / 86400000);
    return quotes[dayOfYear % quotes.length];
  }, [quotes]);

  return (
    <Card className="border-l-4 border-l-accent">
      <p className="mb-2 text-[12px] font-medium uppercase tracking-[1.2px] text-accent">
        Daily Motivation
      </p>
      <p className="text-[16px] italic leading-[22px] text-white">
        &ldquo;{quote}&rdquo;
      </p>
    </Card>
  );
}
