import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Gerak.in — Fitness Tracker Minimalis",
  description:
    "Dashboard, workout log + rest timer, dan progress mingguan. Next.js + Tailwind + Supabase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-background text-white antialiased">
        <AppProvider>
          <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-24 pt-6 sm:pb-10">
            {children}
          </div>
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
