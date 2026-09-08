"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal daftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md pt-10">
      <h1 className="text-[28px] font-bold text-white">Daftar Gerak.in</h1>
      <p className="mb-4 mt-1 text-[15px] text-secondary">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Masuk
        </Link>
      </p>
      <Card>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium uppercase tracking-[1px] text-secondary">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-surfaceAlt px-4 py-2.5 text-white focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium uppercase tracking-[1px] text-secondary">
              Password (min 6 karakter)
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surfaceAlt px-4 py-2.5 text-white focus:border-accent focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-xl bg-accent py-3 font-bold text-background disabled:opacity-60"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
        </form>
      </Card>
    </main>
  );
}
