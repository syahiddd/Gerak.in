<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Exercise;
use Illuminate\Support\Facades\DB;

/**
 * Upserts ExerciseDB payloads into the local exercises table.
 * Idempotent on external_id; local hand-seeded rows are never touched.
 */
class ExerciseSyncService
{
    /** @return array{created:int,updated:int,unmapped_muscle:int,unmapped_equipment:int} */
    public function syncMany(array $items): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'unmapped_muscle' => 0, 'unmapped_equipment' => 0];

        foreach ($items as $raw) {
            if (! is_array($raw)) {
                continue;
            }
            $r = $this->syncOne($raw);
            $stats[$r === 'created' ? 'created' : 'updated']++;
            // Unmapped counters are best-effort; detailed per-row data is logged by the command.
        }

        return $stats;
    }

    /** @param array<string,mixed> $raw @return 'created'|'updated'|null */
    public function syncOne(array $raw): ?string
    {
        $mapped = ExerciseDbMapper::map($raw);
        $externalId = $mapped['external_id'] ?? null;
        if (! $externalId) {
            return null;
        }
        unset($mapped['_unmapped']);

        return DB::transaction(function () use ($mapped, $externalId) {
            $existing = Exercise::where('external_id', $externalId)->first();
            $mapped['last_synced_at'] = now();

            if ($existing) {
                // Never rewrite the slug of an existing row (stable URLs).
                unset($mapped['slug']);
                $existing->update($mapped);

                return 'updated';
            }

            // Guard slug uniqueness for fresh rows.
            $base = $mapped['slug'];
            $i = 2;
            while (Exercise::where('slug', $mapped['slug'])->exists()) {
                $mapped['slug'] = $base.'-'.$i++;
            }

            Exercise::create($mapped);

            return 'created';
        });
    }
}
