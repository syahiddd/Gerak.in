"use client";

import SummaryCard from "@/components/SummaryCard";
import QuoteWidget from "@/components/QuoteWidget";
import { useApp } from "@/context/AppContext";

export default function DashboardPage() {
  const { summary, loading } = useApp();

  return (
    <main className="space-y-4">
      <header className="mb-6">
        <h1 className="text-[28px] font-bold text-white">Hello, Athlete</h1>
        <p className="mt-1 text-[15px] text-secondary">Let&apos;s move today.</p>
      </header>
      {loading ? (
        <div className="rounded-[20px] border border-border bg-surface p-6 text-center text-secondary">
          Memuat data...
        </div>
      ) : (
        <SummaryCard
          activeMinutes={summary.activeMinutes}
          workoutsCompleted={summary.workoutsCompleted}
        />
      )}
      <QuoteWidget />
    </main>
  );
}
