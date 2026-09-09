<?php

namespace Database\Seeders;

use App\Models\BodyMeasurement;
use App\Models\Routine;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserSetting;
use App\Models\Workout;
use App\Models\WorkoutExercise;
use App\Models\WorkoutSet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'admin',
                'timezone' => 'Asia/Jakarta',
            ]
        );
        $this->ensureProfile($admin, 'Admin');

        $demo = User::updateOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Demo Lifter',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'user',
                'timezone' => 'Asia/Jakarta',
            ]
        );
        $this->ensureProfile($demo, 'Demo Lifter');

        // Example routines for demo user.
        $this->seedRoutines($demo);

        // Example history: 8 workouts over past 3 weeks.
        $this->seedHistory($demo);

        // Example body measurements.
        $weights = [78.5, 78.2, 77.9, 77.6, 77.4, 77.1];
        foreach ($weights as $i => $w) {
            BodyMeasurement::updateOrCreate(
                ['user_id' => $demo->id, 'type' => 'weight', 'recorded_at' => now()->subWeeks(5 - $i)->startOfDay()],
                ['value' => $w]
            );
        }
    }

    private function ensureProfile(User $user, string $display): void
    {
        UserProfile::updateOrCreate(['user_id' => $user->id], ['display_name' => $display]);
        UserSetting::updateOrCreate(['user_id' => $user->id], [
            'unit_system' => 'metric',
            'theme' => 'system',
            'default_rest_seconds' => 90,
            'default_sets' => 3,
            'week_starts_on' => 'mon',
        ]);
    }

    private function seedRoutines(User $user): void
    {
        $exId = fn (string $slug) => DB::table('exercises')->where('slug', $slug)->value('id');
        if (! $exId('barbell-bench-press')) {
            return;
        }

        $folder = $user->routineFolders()->firstOrCreate(['name' => 'PPL']);

        $plans = [
            'Push Day' => [
                ['barbell-bench-press', 80, 8], ['incline-dumbbell-press', 30, 10],
                ['overhead-press', 50, 8], ['lateral-raise', 12, 12], ['tricep-pushdown', 30, 12],
            ],
            'Pull Day' => [
                ['pull-up', null, 8], ['barbell-row', 70, 8],
                ['lat-pulldown', 60, 10], ['face-pull', 25, 12], ['dumbbell-curl', 16, 10],
            ],
            'Legs Day' => [
                ['back-squat', 100, 6], ['romanian-deadlift', 80, 8],
                ['leg-press', 160, 10], ['lying-leg-curl', 40, 10], ['standing-calf-raise', 50, 12],
            ],
        ];

        foreach ($plans as $name => $items) {
            $routine = Routine::firstOrCreate(
                ['user_id' => $user->id, 'name' => $name],
                ['folder_id' => $folder->id, 'status' => 'active', 'description' => "Example {$name} routine."]
            );
            if ($routine->exercises()->exists()) {
                continue;
            }
            foreach ($items as $i => [$slug, $weight, $reps]) {
                $id = $exId($slug);
                if (! $id) {
                    continue;
                }
                $re = $routine->exercises()->create([
                    'exercise_id' => $id, 'order' => $i, 'rest_seconds' => 120,
                ]);
                for ($s = 0; $s < 3; $s++) {
                    $re->targetSets()->create([
                        'order' => $s, 'target_reps_min' => $reps, 'target_reps_max' => $reps,
                        'target_weight_kg' => $weight, 'set_type' => 'normal',
                    ]);
                }
            }
        }
    }

    private function seedHistory(User $user): void
    {
        if ($user->workouts()->exists()) {
            return;
        }

        $bench = DB::table('exercises')->where('slug', 'barbell-bench-press')->value('id');
        $squat = DB::table('exercises')->where('slug', 'back-squat')->value('id');
        if (! $bench || ! $squat) {
            return;
        }

        // Progressive overload: 70 → 80kg bench over 8 sessions.
        for ($i = 7; $i >= 0; $i--) {
            $benchW = 70 + (7 - $i);
            $started = now()->subDays($i * 3)->setTime(18, 0);
            $w = Workout::create([
                'user_id' => $user->id,
                'name' => 'Push Day',
                'status' => 'completed',
                'started_at' => $started,
                'ended_at' => (clone $started)->addHour(),
                'duration_seconds' => 3600,
                'timezone' => 'Asia/Jakarta',
            ]);

            $we = WorkoutExercise::create(['workout_id' => $w->id, 'exercise_id' => $bench, 'order' => 0]);
            $vol = 0;
            for ($s = 0; $s < 3; $s++) {
                WorkoutSet::create([
                    'workout_exercise_id' => $we->id, 'order' => $s, 'set_type' => 'normal',
                    'weight_kg' => $benchW, 'reps' => 8, 'is_completed' => true, 'completed_at' => $started,
                ]);
                $vol += $benchW * 8;
            }
            $we2 = WorkoutExercise::create(['workout_id' => $w->id, 'exercise_id' => $squat, 'order' => 1]);
            for ($s = 0; $s < 3; $s++) {
                WorkoutSet::create([
                    'workout_exercise_id' => $we2->id, 'order' => $s, 'set_type' => 'normal',
                    'weight_kg' => 100, 'reps' => 6, 'is_completed' => true, 'completed_at' => $started,
                ]);
                $vol += 100 * 6;
            }
            $w->update(['total_volume_kg' => $vol]);
        }
    }
}
