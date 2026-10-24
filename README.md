# Gerak.in — Workout Tracking Web App

Modern workout tracking app (original brand, inspired by the product category of Hevy — not a copy).
Stack: **Laravel 13 · Breeze Blade · Tailwind v4 · Alpine.js · Chart.js · Vite · MySQL 8** (SQLite for local tests).

Full spec: see [`PRD.md`](./PRD.md).

## Features (MVP Phase 1)

- Auth (register/login/logout/forgot/reset/verify), Dashboard, Exercise Library + custom exercises
- Routines + folders (duplicate/archive/reorder, target sets/reps/weight/RPE/rest)
- Active workout (elapsed timer, LAST TIME vs CURRENT, set types, rest timer, autosave + resume)
- History + detail, Personal Records (auto-detect + banner), Basic statistics + charts
- Profile/settings (kg/cm vs lb/in, theme system/light/dark, rest default, week start, timezone)
- Admin (users, system exercises, app stats)

## Requirements

- PHP 8.3+, Composer 2, Node 22+, MySQL 8 (or SQLite for quick local run)

## Installation

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
# SQLite quick start:
php artisan migrate --seed
# MySQL (Laragon): set DB_* in .env to DB_DATABASE=gerakin, then:
php artisan migrate --seed
npm run dev
php artisan serve
```

Open http://localhost:8000.

## Exercise library & animations

The 46 seeded exercises can be extended to ~1,340 exercises with animations:

```bash
php artisan storage:link
# ~1,300 exercises + 2,600 GIF/JPG files (~140 MB) from hasaneyldrm/exercises-dataset
php artisan exercises:import-dataset
# Optional: WorkoutX GIFs for the seeded exercises (needs WORKOUTX_API_KEY)
php artisan workoutx:sync-gifs
```

`exercises:import-dataset` is safe to re-run (it only fills empty fields and retries failed downloads).
Use `--limit=20` for a trial, `--no-media` for data only, or `--source=path/to/clone` to import from a local clone.

**Licensing.** Exercise data from [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) is MIT.
The images/GIFs are **© Gym visual** (https://gymvisual.com/), distributed in that repo with permission at 180×180, and must
always carry that attribution (the app shows it under animations and in the page footer). Reuse is governed by Gym visual's
Terms & Conditions; a commercial release needs a license from Gym visual.

## Demo accounts (development only)

| Role | Email | Password |
|---|---|---|
| Demo user | `demo@example.com` | `password` |
| Admin | `admin@example.com` | `password` |

> Seeded by `DatabaseSeeder`. Never use these passwords in production.

## Testing

```bash
php artisan test
```

## Project structure

```
app/
  Enums/            ExerciseType, SetType, WorkoutStatus, RoutineStatus, UnitSystem, UserRole, ...
  Models/           User, Exercise, Routine, Workout, PersonalRecord, BodyMeasurement, ...
  Services/         WorkoutService, RoutineService, StatisticsService, PersonalRecordService, ...
  Policies/         RoutinePolicy, WorkoutPolicy, ExercisePolicy, ...
  Http/Controllers/ + Requests/   thin controllers, Form Requests
resources/views/    Blade layouts + reusable components (button, card, set-row, rest-timer, ...)
database/           migrations, factories, seeders (system exercises live in seeders, never hardcoded)
routes/             web.php, auth.php (Breeze), admin.php
tests/              Feature/, Unit/
```

## Architecture notes

- `Routine ≠ Workout`: starting a workout deep-copies the template in a transaction; editing a workout never mutates the routine.
- Canonical units in DB: `weight_kg`, `distance_m`, `size_cm`. Conversion only in presentation (`UnitConverter`).
- Volume = `Σ(weight_kg × reps)` for completed weight sets only. 1RM = Epley, labeled "est."
- Timestamps stored UTC, rendered in user timezone.
- Cache only global reference data (system exercises/muscles/equipment).
