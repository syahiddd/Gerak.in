# Gerak.in — Fitness Tracker Minimalis

Aplikasi web fitness tracker dark-mode minimalis: **Dashboard, Workout (log Sets/Reps + Rest Timer), Progress mingguan**.
Dibangun dengan **Next.js App Router + TailwindCSS + Supabase (Postgres + Auth + RLS)**.

> Hasil migrasi dari Expo React Native ke web. Tema atletik dipertahankan: background `#0E0E10`, aksen neon `#39FF14`.

## ✨ Fitur

- **Dashboard (`/`)** — sapaan + ringkasan `Active Time` & `Workouts` + quote motivasi harian (rotasi per hari, diambil dari tabel `quotes`).
- **Workout (`/workout`)** — katalog ExerciseDB V1 OSS (~1.500 exercise, field nama+target+gif), search prefix via **binary search** + tab Semua/Favorit, pilih exercise, form Sets/Reps dengan validasi, timer istirahat 30/60/90 detik (Start/Pause/Reset). Favorit tersimpan per-user di Supabase.
- **Progress (`/progress`)** — tracker Mon–Sun + bar chart + 5 aktivitas terakhir.
- **Auth dasar (`/login`, `/register`)** — email/password Supabase, route `/`, `/workout`, `/progress` diproteksi `middleware.ts`.
- **Persistensi per-user** — `logWorkout()` insert ke `workouts` + upsert `weekly_progress` hari ini. Tanpa Supabase, app tetap jalan dalam **mode demo lokal** (in-memory).

## 🧰 Tech Stack

| Lapisan  | Teknologi |
| -------- | --------- |
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling  | TailwindCSS 3.4 + CSS vars (eks `src/theme/colors.js`) |
| Database/Auth | Supabase: Postgres + Auth email/password + RLS + `@supabase/ssr` |
| Ikon     | `lucide-react` (pengganti Ionicons) |
| Katalog latihan | ExerciseDB V1 OSS gratis (`oss.exercisedb.dev`, tanpa key, non-komersial + atribusi) |
| Search   | Binary search prefix `O(log n + k)` di `lib/exercisedb/search.ts` (data terurut by nama) |
| Cache    | 3 lapis TTL 7 hari: L1 Next `revalidate: 604800` + L2 Supabase `exercise_cache` + L3 `localStorage` frontend |
| State    | React Context (`context/AppContext.tsx`) di atas Supabase client |

## 📋 Prasyarat

- Node.js 20+ dan npm 10+ (`node --version`, `npm --version`)
- Git
- Akun Supabase Cloud gratis (hanya jika mau persistensi asli, bukan mode demo)

## 🚀 Cara Run (clone → jalan < 5 menit)

```powershell
git clone <url-repo-anda>
Set-Location Gerak.in
npm install
Copy-Item .env.example .env.local
npm run dev
```

Buka http://localhost:3000.

### Setup Supabase (wajib untuk data asli)

1. Buat project di https://supabase.com/dashboard → ambil **Project URL** dan **anon public key** dari Settings → API.
2. Isi `.env.local`:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. Buka Supabase → SQL Editor → jalankan seluruh isi `lib/supabase/schema.sql`. Ini membuat tabel `profiles`, `workouts`, `weekly_progress`, `quotes` ( + seed 7 quotes), **`exercise_cache` + `exercise_favorites`** + RLS per-user, dan trigger auto-create profile.
4. Di Authentication → Providers, pastikan **Email** aktif.
5. Restart dev server, buka `/register` → daftar → login → log workout di `/workout` → cek tetap ada setelah reload.

> Tanpa langkah di atas (`.env.local` kosong), app jalan normal tapi data hanya in-memory dan auth dilewati middleware.

### Scripts

| Perintah | Fungsi |
| -------- | ------ |
| `npm run dev` | Dev server http://localhost:3000 |
| `npm run build` | Build produksi (sudah terverifikasi sukses) |
| `npm start` | Jalankan hasil build |
| `npm run lint` | Lint Next.js |
| `npx tsc --noEmit` | Cek TypeScript |

## ⚙️ Konfigurasi Penting

- Ganti aksen: `tailwind.config.ts` → `theme.extend.colors.accent` (`#39FF14` default, coba `#00C2FF`).
- Tambah quote: insert ke tabel `quotes` atau fallback `FALLBACK_QUOTES` di `components/QuoteWidget.tsx`.
- Rumus ringkasan (dipertahankan dari versi Expo): `totalReps = Σ(sets×reps)`, `activeMinutes = round(totalReps×3/60)`.
- ExerciseDB: tanpa key. Opsional `EXERCISEDB_BASE_URL` di `.env.local` (default `https://oss.exercisedb.dev`). Refresh paksa katalog: `GET /api/exercises?refresh=1`. Atribusi wajib: "Data: ExerciseDB OSS (non-komersial)".
- Binary search: data harus terurut by nama (`sortByName`); query min 2 huruf untuk prefix `O(log n)`, fallback substring linear bila prefix kosong.

## 📁 Struktur Proyek

```
app/
  layout.tsx            RootLayout dark + BottomNav (pengganti App.js Tab.Navigator)
  page.tsx              Dashboard (eks DashboardScreen)
  workout/page.tsx      Workout (eks WorkoutScreen + EXERCISES)
  progress/page.tsx     Progress (eks ProgressScreen)
  login/page.tsx        Login Supabase
  register/page.tsx     Register Supabase
  globals.css           Token tema (eks colors.js)
components/
  Card, SummaryCard, QuoteWidget, ExerciseItem (gif+hati favorit),
  LogWorkoutForm, RestTimer, WeeklyTracker, BottomNav
context/AppContext.tsx  logWorkout + summary + weeklyProgress + favorites (Supabase + fallback demo)
lib/
  supabase/client.ts, server.ts, database.types.ts, schema.sql
  exercisedb/types.ts, client.ts (fetch OSS), search.ts (binary search), frontendCache.ts (localStorage 7 hari)
app/api/exercises/route.ts  Proxy OSS + cache 7 hari (L1 Next + L2 Supabase) + fallback lokal
middleware.ts           Proteksi route + refresh session Supabase
.env.example            Template env (jangan commit .env.local)
```

## 🧑‍💻 Panduan Kontribusi

1. Fork → clone fork-mu.
2. Buat branch: `git checkout -b feat/nama-fitur` atau `fix/nama-bug`.
3. Jangan commit `.env.local`, `.next/`, `node_modules/`.
4. Pastikan lolos: `npx tsc --noEmit` dan `npm run build`.
5. Push → buka Pull Request dengan deskripsi: masalah, perubahan, cara test, screenshot jika UI.
6. Gunakan pesan commit jelas, mis. `feat: tambah hapus workout`, `fix: perbaiki timer reset`.

## 🐛 Troubleshooting

- **Halaman kosong / data tidak tersimpan:** cek `.env.local` sudah diisi dan `schema.sql` sudah dijalankan. Cek RLS: query tanpa login harus 0 rows.
- **Redirect loop login:** hapus cookies `sb-*` di browser, pastikan URL/anon key benar, restart `npm run dev`.
- **Port 3000 dipakai:** `npx next dev -p 3001`.
- **Error `No matching version @supabase/ssr`:** jangan pakai `^0.4.2` (sudah dihapus dari registry). Repo ini sudah memakai `^0.6.1`.
- **Katalog workout kosong / `source: fallback`:** OSS sedang down atau diblokir — app tetap jalan dengan 3 exercise lokal. Coba `GET /api/exercises?refresh=1` setelah OSS pulih.
- **Build gagal setelah edit:** jalankan `npx tsc --noEmit` untuk lihat error baris persis.

## 🗺️ Roadmap

- Hapus/edit workout, reset mingguan otomatis.
- OAuth Google, avatar via Supabase Storage.
- Realtime progress + PWA + deploy Vercel.

## 📄 Lisensi

MIT — bebas dipakai dan dimodifikasi. Tambahkan file `LICENSE` bila perlu distribusi publik.
