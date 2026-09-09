# PRD — Gerak.in (Workout Tracking Web App)

> Single source of truth untuk development. Semua implementasi wajib merujuk ke dokumen ini.
> Status: MVP Phase 1. Bahasa produk MVP: English. Stack: Laravel 13, Breeze Blade, Tailwind v4, Alpine.js, Chart.js, MySQL 8 (SQLite untuk test lokal).

## 1. Visi & Branding

**Gerak.in** adalah training companion yang serius: menjawab dalam < 10 detik — "latihan apa hari ini?", "terakhir ngapain?", "naik berapa?", "apakah gue improving?".

- **Original brand.** Dilarang meniru branding, logo, teks, atau layout Hevy.com. Hevy hanya referensi kategori (workout logging, routine reusable, exercise library, PR, statistik).
- Visual: netral zinc/slate + satu aksen volt-lime/emerald, kartu rounded, tipografi Inter, angka statistik besar, dark mode `system|light|dark` sejak awal.
- Mobile-first untuk layar workout aktif; tombol touch-friendly; tidak ada aksi kritis yang hanya-hover.

## 2. Roles

| Role | Akses MVP |
|---|---|
| `user` | Semua fitur milik sendiri (routine, workout, measurement, custom exercise) |
| `admin` | + kelola system exercise, lihat/suspend user, statistik aplikasi |
| `coach`, `premium` | Ditunda (Phase 4). Kolom `users.role` enum siap diperluas |

## 3. Konsep Data Inti: Routine ≠ Workout

- **Routine** = template reusable (mis. "Push Day" berisi Bench, OHP, ...).
- **Workout** = sesi nyata yang dieksekusi user.
- Saat `Start Workout`, sistem **deep-copy** routine → workout (exercises + target sets) dalam satu DB transaction. Edit workout tidak pernah memutasi routine (integritas histori).

## 4. MVP Scope

### Phase 1 (wajib)
Auth (register/login/logout/forgot/reset/verify), Dashboard, Exercise Library, Custom Exercises (CRUD milik sendiri), Routines + Folders, Active Workout + autosave/resume, History + Detail, Personal Records otomatis, Basic Statistics, Profile + Settings (unit, tema, rest default, week start, timezone).

### Phase 2
Body Measurements + chart, upload media exercise, notifikasi (PR, workout selesai), polish recovery.

### Phase 3
Social (follow, public profile/workout, like, comment, feed, leaderboard). **Migrasi social sengaja ditunda** — jangan buat tabelnya di MVP.

### Phase 4
Coach, subscription/premium, PWA offline penuh, API mobile (Sanctum) di atas service yang sama.

## 5. User Stories + Acceptance Criteria (MVP)

1. Register → login → buka dashboard (greeting, today's workout, recent, stats, chart mingguan).
2. Browse exercise: search (debounced), filter muscle/equipment/type, sort, pagination, detail (media placeholder, otot, instruksi, histori user, PB, estimasi 1RM, chart).
3. Buat routine: tambah/hapus/susun ulang exercise, target sets/reps/weight/RPE/rest, notes, superset group opsional.
4. Organisasi folder: create/rename/delete, pindah routine antar folder.
5. Start workout dari routine/kosong → lihat elapsed time, pause/finish/cancel.
6. Lihat `LAST TIME` per exercise (mis. `80 kg × 8`) di atas input CURRENT.
7. Log set dengan minimal tap: isi weight → reps → ✓. Ganti tipe set (normal/warmup/drop/failure/assisted). Rest timer otomatis mulai, bisa skip/pause/reset (frontend only).
8. Tambah/ganti/susun ulang exercise di tengah workout.
9. Refresh browser di tengah workout → tidak hilang (persist DB + backup localStorage + banner "Resume workout?").
10. Finish → summary (durasi, volume, sets, PR baru) → masuk history.
11. History: filter tanggal/routine/muscle; detail: exercise + set, notes, PR; aksi edit/duplicate-jadi-routine/delete (dengan konfirmasi).
12. PR terdeteksi otomatis: heaviest weight, best set volume, best 1RM est, most reps. Banner "New Personal Record!".
13. Statistik dasar: workout/minggu, volume, frekuensi, streak, distribusi otot. Chart responsif.
14. Profile/settings: unit `kg/cm|lb/in`, tema, rest default, week start, timezone. Konversi hanya di presentasi.
15. Otorisasi: user hanya bisa akses miliknya; non-admin ditolak di `/admin`. Semua mutasi dicek server-side (Policy), bukan hanya frontend.

## 6. Aturan Bisnis Kunci

- **Unit:** simpan canonical `weight_kg`, `distance_m`, `size_cm`. Jangan campur unit di DB/kalkulasi.
- **Volume:** `Σ(weight_kg × reps)` hanya untuk set selesai bertipe beban. Set durasi/jarak menyumbang reps/time stats, bukan volume kg. Bodyweight: `weight_kg` = beban tambahan; snapshot `bodyweight_kg` opsional (nullable, belum dipakai di rumus MVP).
- **1RM:** Epley `w × (1 + r/30)`, syarat `w > 0, 1 ≤ r ≤ 30`, tipe beban saja. Selalu label "est."
- **Waktu:** simpan UTC; render sesuai timezone user. Durasi = `ended_at − started_at − paused_seconds_total`.
- **Transaksi:** semua mutasi multi-tabel (start, finish, duplicate, reorder) dalam `DB::transaction`.
- **Histori sakral:** workout selesai tidak di-soft-delete diam-diam; delete eksplisit + konfirmasi. Relasi pakai FK + cascade yang hati-hati (PR menunjuk workout dengan `nullOnDelete`).
- **Jangan:** fake statistik, hitung kritis hanya di frontend, percaya otorisasi client, taruh logika besar di Blade/controller, abstraksi berlebihan (repository hanya bila perlu).

## 7. Skema Database (MVP)

```
users(id, name, email, password, role[user|admin], is_suspended, timezone, timestamps)
user_profiles(user_id PK/FK, display_name, avatar_path, bio, height_cm, is_public)
user_settings(user_id PK/FK, unit_system[metric|imperial], theme[system|light|dark], default_rest_seconds, default_sets, week_starts_on[mon|sun], notifications json)

muscles(id, name, slug unique, group)
equipment(id, name, slug unique)
exercises(id, slug unique, name, description, instructions, equipment_id→equipment nullable, primary_muscle_id→muscles, secondary_muscle_ids json, exercise_type enum, image_path, video_url, is_system, created_by→users nullable, timestamps + soft deletes untuk custom)
  index: (is_system), (primary_muscle_id), fulltext(name)

routine_folders(id, user_id→users cascade, name, timestamps; unique user_id+name)
routines(id, user_id cascade, folder_id→folders nullOnDelete, name, description, notes, status[active|archived], timestamps + soft deletes)
routine_exercises(id, routine_id cascade, exercise_id restrict, `order`, notes, rest_seconds, superset_group nullable)
routine_exercise_sets(id, routine_exercise_id cascade, `order`, target_reps_min/max, target_weight_kg, target_duration_s, target_distance_m, set_type enum, target_rpe nullable)

workouts(id, user_id cascade, routine_id→routines nullOnDelete (provenance), name, notes, status[in_progress|paused|completed|cancelled], started_at, paused_seconds_total default 0, ended_at nullable, duration_seconds nullable (diisi saat finish), total_volume_kg nullable, timezone; index (user_id,status,started_at))
workout_exercises(id, workout_id cascade, exercise_id restrict, `order`, notes, superset_group nullable)
workout_sets(id, workout_exercise_id cascade, `order`, set_type enum, weight_kg, reps, duration_s, distance_m, rpe, bodyweight_kg nullable, is_completed default false, completed_at nullable; index (workout_exercise_id, is_completed))

personal_records(id, user_id cascade, exercise_id cascade, record_type[heaviest_weight|best_set_volume|best_1rm_est|most_reps|best_duration|longest_distance], value_primary, value_reps nullable, achieved_workout_id→workouts nullOnDelete, achieved_at; unique (user_id,exercise_id,record_type))
body_measurements(id, user_id cascade, type[weight|body_fat|chest|waist|hips|arm_l|arm_r|thigh_l|thigh_r], value_canonical, recorded_at, notes; index (user_id,type,recorded_at))
```

JSON hanya untuk metadata fleksibel (`secondary_muscle_ids`, settings). Data workout inti selalu relasional.

## 8. Enums (PHP backed)

`ExerciseType: weight_reps|bodyweight_reps|duration|distance_duration|assisted_bodyweight|weighted_bodyweight` · `SetType: normal|warmup|drop|failure|assisted (+myo_rep optional)` · `WorkoutStatus: in_progress|paused|completed|cancelled` · `RoutineStatus: active|archived` · `UnitSystem: metric|imperial` · `UserRole: user|admin` · `MeasurementType`, `RecordType` sesuai tabel.

## 9. Route Map (`routes/web.php` + `admin.php`)

```
/dashboard
/workouts, POST /workouts/empty, POST /workouts/from-routine/{routine}
/workouts/active, GET /workouts/{workout}, PATCH /workouts/{workout}
/workouts/{workout}/finish|cancel|pause|resume (POST)
/workouts/{workout}/exercises (POST/PATCH/DELETE), /workouts/{workout}/sets (POST), PATCH/DELETE /sets/{set}
/routines, /routines/create, /routines/{routine}, /routines/{routine}/edit
POST /routines/{routine}/duplicate|archive|start
/routine-folders (POST/PATCH/DELETE + move)
/exercises, /exercises/{exercise:slug}, custom create/edit/delete
/statistics, /records, /measurements, /profile, /settings, /admin/*
```
Named routes, model binding (scope per-user via Policy), middleware `auth,verified`, throttle untuk login + mutasi workout.

## 10. Arsitektur Layanan

- `WorkoutService` — startFromRoutine/startEmpty/add/replace/reorderExercise/logSet/completeSet/pause/resume/finish (hitung durasi+volume, panggil PR service).
- `RoutineService` — CRUD, duplicate deep-copy, reorder, attach/detach.
- `PersonalRecordService` — evaluasi kandidat per exercise saat finish, insert event baru, kembalikan daftar PR untuk banner.
- `StatisticsService` — volume mingguan/bulanan, frekuensi, streak (week-start aware), distribusi otot, progres exercise. Query agregat SQL + eager load; paginasi history.
- Support: `UnitConverter`, `OneRmCalculator` (Epley), `VolumeCalculator`.
- Controller tipis; Form Request untuk validasi; Policy untuk otorisasi; Blade tidak menghitung statistik.

## 11. Frontend & Komponen

Layout `guest/app/admin`; atom: button variants, card, stat-card, input/select/textarea/toggle, modal, drawer, dropdown, empty-state, loading, toast, confirm-dialog. Domain: routine-card, exercise-card, workout-exercise-card, set-row (LAST TIME di atas CURRENT, input besar), rest-timer (Alpine, countdown lokal + sound/notifikasi opsional), pr-banner, progress-chart (Chart.js). Search di-debounce; autosave set di-debounce.

## 12. Testing Wajib

Feature: register/login/logout/reset; routine create/update/delete/duplicate/reorder; workout start-from-routine/add-exercise/add-set/complete/finish/resume; authz (user A ≠ user B, non-admin → 403 admin); PR detection; volume & streak math. Unit: converter, 1RM, volume per tipe. Perintah: `php artisan test`.

## 13. Risiko

Autosave race (server source of truth + idempotency key saat create set), drift timer (timestamp server otoritatif), timezone, semantik volume per tipe, biaya query statistik (kolom ringkasan saat finish), kepadatan UI mobile, perbandingan PR lintas unit (selalu kg).

## 14. Definisi Selesai (MVP)

23 acceptance criteria §5 lolos + `php artisan test` hijau + `npm run build` sukses + QA §69 (tidak ada broken route, N+1, validasi bocor, dark mode rusak, konversi salah, PR salah hitung, workout hilang saat refresh).
