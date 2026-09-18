<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Exercise;
use App\Services\ExerciseDbClient;
use App\Services\ExerciseDbMapper;
use App\Services\ExerciseSyncService;
use Illuminate\Database\Seeder;

/**
 * Enriches the 46 hand-seeded local exercises with ExerciseDB animation
 * media (video + images) by fuzzy name search.
 *
 * Safe to run without a key (skips quietly). Keeps batches tiny for the
 * free/trial tier. Never creates duplicates: matched rows are linked via
 * external_id on the existing local exercise when names match closely.
 */
class ExerciseMediaSeeder extends Seeder
{
    /** @var string[] */
    private array $curated = [
        'Barbell Bench Press',
        'Back Squat',
        'Deadlift',
        'Overhead Press',
        'Pull-Up',
        'Barbell Row',
        'Barbell Curl',
        'Tricep Pushdown',
        'Plank',
        'Hip Thrust',
    ];

    public function run(): void
    {
        $client = app(ExerciseDbClient::class);
        $sync = app(ExerciseSyncService::class);

        if (! $client->configured()) {
            $this->command?->warn('ExerciseMediaSeeder skipped: EXERCISEDB_API_KEY is empty.');

            return;
        }

        foreach ($this->curated as $name) {
            try {
                $res = $client->search($name, 5);
                $items = $res['data'] ?? [];
                if ($items === []) {
                    continue;
                }

                // Prefer detail payload (has videoUrl/imageUrls) for the top hit.
                $top = $items[0];
                $detail = isset($top['exerciseId']) ? $client->fetchById((string) $top['exerciseId']) : null;
                $raw = $detail ?? $top;

                // Link media onto the existing local row when the name matches,
                // instead of creating a parallel ExerciseDB row.
                $local = Exercise::where('external_id', null)
                    ->where('name', $name)
                    ->first();

                if ($local && (isset($raw['videoUrl']) || isset($raw['imageUrl']))) {
                    $mapped = ExerciseDbMapper::map($raw);
                    $unmapped = $mapped['_unmapped'] ?? [];
                    unset($mapped['_unmapped'], $mapped['slug'], $mapped['name'], $mapped['external_id']);
                    // Keep local coaching text; only fill empty media fields.
                    foreach (['image_url', 'image_urls', 'gif_url', 'video_url', 'overview', 'exercise_tips', 'variations', 'keywords', 'related_exercise_ids'] as $field) {
                        if (empty($local->{$field}) && ! empty($mapped[$field])) {
                            $local->{$field} = $mapped[$field];
                        }
                    }
                    $local->media_source = 'exercisedb';
                    $local->last_synced_at = now();
                    $local->save();
                    unset($unmapped);
                } else {
                    $sync->syncOne($raw);
                }

                // Be kind to the trial rate limit.
                usleep(300000);
            } catch (\Throwable $e) {
                $this->command?->warn("Media sync failed for {$name}: {$e->getMessage()}");
            }
        }
    }
}
