<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ExerciseDbClient;
use App\Services\ExerciseSyncService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('exercisedb:sync {--search= : Fuzzy search term instead of paged list} {--id= : Sync a single exerciseId} {--limit=50 : Batch size 1-100 (keep small on trial)} {--cursor= : Resume cursor from previous run} {--dry-run : Fetch only, write nothing}')]
#[Description('Sync exercises + animation media from ExerciseDB v2 (RapidAPI). Trial tier: use small batches.')]
class SyncExercisesFromExerciseDb extends Command
{
    public function handle(ExerciseDbClient $client, ExerciseSyncService $sync): int
    {
        $search = (string) ($this->option('search') ?? '');
        $id = (string) ($this->option('id') ?? '');
        $limit = max(1, min((int) ($this->option('limit') ?? 50), 100));
        $cursor = $this->option('cursor') ? (string) $this->option('cursor') : null;
        $dryRun = (bool) $this->option('dry-run');

        if (! $client->configured()) {
            $this->error('EXERCISEDB_API_KEY is empty. Add your RapidAPI key to .env first.');
            $this->line('Get a key: RapidAPI → "EDB with Videos and Images by AscendAPI" → subscribe (free trial OK, watermarked).');

            return self::FAILURE;
        }

        if ($id !== '') {
            $raw = $client->fetchById($id);
            if (! $raw) {
                $this->error("Exercise {$id} not found (or rate limited).");

                return self::FAILURE;
            }
            if ($dryRun) {
                $this->info("Dry run: would upsert '{$raw['name']}' ({$id}).");

                return self::SUCCESS;
            }
            $result = $sync->syncOne($raw);
            $this->info("Synced '{$raw['name']}' ({$result}).");

            return self::SUCCESS;
        }

        $items = [];
        $nextCursor = null;

        if ($search !== '') {
            $res = $client->search($search, $limit);
            $items = $res['data'] ?? [];
            if (($res['error'] ?? null) === 'rate_limited') {
                $this->error('Rate limited (429). Try a smaller --limit later. Nothing was written.');

                return self::FAILURE;
            }
        } else {
            $res = $client->listPage($cursor, $limit);
            $items = $res['data'] ?? [];
            $nextCursor = $res['meta']['nextCursor'] ?? null;
            if (($res['error'] ?? null) === 'rate_limited') {
                $this->error('Rate limited (429). Try again later with --cursor to resume. Nothing was written.');

                return self::FAILURE;
            }
        }

        if ($items === []) {
            $this->warn('No items returned (empty page, bad key, or rate limit). Nothing was written.');

            return self::FAILURE;
        }

        if ($dryRun) {
            $this->info('Dry run: would upsert '.count($items).' exercises:');
            foreach (array_slice($items, 0, 10) as $it) {
                $this->line(' - '.($it['name'] ?? '?').' ('.($it['exerciseId'] ?? '?').')');
            }

            return self::SUCCESS;
        }

        $stats = $sync->syncMany($items);
        $this->info("Done: {$stats['created']} created, {$stats['updated']} updated.");
        if ($nextCursor) {
            $this->line("Next cursor: {$nextCursor}");
            $this->line('Resume with: php artisan exercisedb:sync --cursor="'.$nextCursor.'" --limit='.$limit);
        }

        return self::SUCCESS;
    }
}
