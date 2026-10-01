<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workout;
use App\Models\WorkoutComment;
use App\Models\WorkoutExercise;
use App\Models\WorkoutLike;
use App\Models\WorkoutSet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * A few lifters with shared workouts, follows, likes and comments so the
 * feed isn't empty on a fresh install. Safe to re-run (skips seeded users).
 * All accounts use password "password".
 */
class SocialDemoSeeder extends Seeder
{
    private const PEOPLE = [
        ['Rina Pratama', 'rina@example.com', 'Powerlifting, 3x a week. Chasing a 100 kg squat.'],
        ['Bima Saputra', 'bima@example.com', 'Push / pull / legs. Coffee before every session.'],
        ['Sari Wulandari', 'sari@example.com', 'Getting back into the gym after a long break.'],
    ];

    /** [title, visibility, days ago, [[slug, kg, reps, sets], ...]] */
    private const SESSIONS = [
        'rina@example.com' => [
            ['Heavy squat day', 'public', 0, [['back-squat', 90, 5, 5], ['romanian-deadlift', 70, 8, 3], ['leg-press', 180, 10, 3]]],
            ['Bench + accessories', 'followers', 2, [['barbell-bench-press', 55, 6, 4], ['overhead-press', 35, 8, 3], ['tricep-pushdown', 25, 12, 3]]],
            ['Deadlift PR attempt', 'public', 5, [['deadlift', 120, 3, 3], ['barbell-row', 50, 8, 3]]],
        ],
        'bima@example.com' => [
            ['Pull day', 'public', 1, [['pull-up', null, 10, 4], ['barbell-row', 75, 8, 4], ['lat-pulldown', 65, 10, 3], ['dumbbell-curl', 16, 12, 3]]],
            ['Push day', 'public', 3, [['barbell-bench-press', 90, 6, 4], ['incline-dumbbell-press', 32, 10, 3], ['lateral-raise', 12, 15, 3]]],
            ['Late night legs', 'private', 4, [['back-squat', 110, 6, 4]]],
        ],
        'sari@example.com' => [
            ['First week back', 'public', 1, [['goblet-squat', 16, 12, 3], ['push-up', null, 10, 3], ['plank', null, null, 3]]],
            ['Upper body', 'followers', 6, [['dumbbell-curl', 8, 12, 3], ['lateral-raise', 5, 15, 3]]],
        ],
    ];

    public function run(): void
    {
        $demo = User::where('email', 'demo@example.com')->first();
        $people = [];

        foreach (self::PEOPLE as [$name, $email, $bio]) {
            $user = User::firstOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => Hash::make('password'), 'email_verified_at' => now(), 'timezone' => 'Asia/Jakarta']
            );
            $user->profile()->updateOrCreate(['user_id' => $user->id], ['bio' => $bio, 'display_name' => $name]);
            $people[$email] = $user;

            if (! $user->workouts()->exists()) {
                foreach (self::SESSIONS[$email] as $session) {
                    $this->seedWorkout($user, ...$session);
                }
            }
        }

        if (! $demo) {
            return;
        }

        // Demo's two most recent workouts become public posts.
        $demo->workouts()->completed()->latest('started_at')->limit(2)->get()
            ->each(fn (Workout $w) => $w->update(['visibility' => 'public', 'description' => $w->description ?? 'Steady progress on bench this week.']));

        $rina = $people['rina@example.com'];
        $bima = $people['bima@example.com'];
        $sari = $people['sari@example.com'];

        $demo->following()->syncWithoutDetaching([$rina->id, $bima->id]);
        $rina->following()->syncWithoutDetaching([$demo->id, $bima->id]);
        $bima->following()->syncWithoutDetaching([$rina->id]);
        $sari->following()->syncWithoutDetaching([$demo->id, $rina->id, $bima->id]);

        $rinaSquat = $rina->workouts()->where('name', 'Heavy squat day')->first();
        $bimaPull = $bima->workouts()->where('name', 'Pull day')->first();
        $demoLatest = $demo->workouts()->completed()->latest('started_at')->first();

        $this->like($rinaSquat, [$demo, $bima, $sari]);
        $this->like($bimaPull, [$rina, $sari]);
        $this->like($demoLatest, [$rina, $sari]);

        $this->comment($rinaSquat, $bima, 'Depth looked solid. 100 kg is close!');
        $this->comment($rinaSquat, $sari, 'So inspiring 🔥');
        $this->comment($demoLatest, $rina, 'Nice bench progression this month.');
    }

    private function seedWorkout(User $user, string $title, string $visibility, int $daysAgo, array $items): void
    {
        $started = now()->subDays($daysAgo)->setTime(7 + $daysAgo % 12, 15);
        $duration = 2700 + count($items) * 600;

        $w = Workout::create([
            'user_id' => $user->id,
            'name' => $title,
            'status' => 'completed',
            'visibility' => $visibility,
            'started_at' => $started,
            'ended_at' => (clone $started)->addSeconds($duration),
            'duration_seconds' => $duration,
            'timezone' => 'Asia/Jakarta',
        ]);

        $volume = 0;
        foreach ($items as $order => [$slug, $kg, $reps, $sets]) {
            $exerciseId = DB::table('exercises')->where('slug', $slug)->value('id');
            if (! $exerciseId) {
                continue;
            }
            $we = WorkoutExercise::create(['workout_id' => $w->id, 'exercise_id' => $exerciseId, 'order' => $order]);
            for ($s = 0; $s < $sets; $s++) {
                WorkoutSet::create([
                    'workout_exercise_id' => $we->id,
                    'order' => $s,
                    'set_type' => 'normal',
                    'weight_kg' => $kg,
                    'reps' => $reps,
                    'duration_s' => $reps === null ? 60 : null,
                    'is_completed' => true,
                    'completed_at' => $started,
                ]);
                $volume += ($kg ?? 0) * ($reps ?? 0);
            }
        }

        $w->update(['total_volume_kg' => $volume]);
    }

    /** @param User[] $users */
    private function like(?Workout $w, array $users): void
    {
        foreach ($users as $u) {
            if ($w) {
                WorkoutLike::firstOrCreate(['workout_id' => $w->id, 'user_id' => $u->id]);
            }
        }
    }

    private function comment(?Workout $w, User $by, string $body): void
    {
        if ($w) {
            WorkoutComment::firstOrCreate(['workout_id' => $w->id, 'user_id' => $by->id, 'body' => $body]);
        }
    }
}
