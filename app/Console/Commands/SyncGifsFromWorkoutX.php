<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Exercise;
use App\Services\WorkoutXClient;
use App\Services\WorkoutXMatcher;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

#[Signature('workoutx:sync-gifs {--limit=50 : Max exercises to process this run} {--only= : Only this exercise slug} {--force : Re-match exercises that already have a gif_url} {--dry-run : Match only, write nothing} {--delay=2100 : Milliseconds between API calls (free tier: 30/min)} {--pages=4 : Max result pages (10 each) to scan per search}')]
#[Description('Attach WorkoutX GIF animations to local exercises by name matching (GIFs are stored locally).')]
class SyncGifsFromWorkoutX extends Command
{
    private const DIR = 'exercise-gifs';

    private int $calls = 0;

    public function handle(WorkoutXClient $client): int
    {
        if (! $client->configured()) {
            $this->error('WORKOUTX_API_KEY is empty. Add your WorkoutX key to .env first.');
            $this->line('Get a free key at https://workoutxapp.com (500 requests/month).');

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');

        $query = Exercise::query()->orderBy('id');
        if ($only = $this->option('only')) {
            $query->where('slug', (string) $only);
        }
        if (! $this->option('force')) {
            $query->whereNull('gif_url');
        }
        $exercises = $query->limit(max(1, (int) $this->option('limit')))->get();

        if ($exercises->isEmpty()) {
            $this->info('Nothing to do: every selected exercise already has a GIF.');

            return self::SUCCESS;
        }

        $matched = 0;
        $unmatched = [];
        $failed = [];

        foreach ($exercises as $exercise) {
            [$res, $hit] = $this->find($client, $exercise->name, WorkoutXMatcher::searchTerm($exercise->name));

            if ($res['success'] && ! $hit && ($fallback = WorkoutXMatcher::fallbackTerm($exercise->name))) {
                [$res, $hit] = $this->find($client, $exercise->name, $fallback);
            }

            if (($res['error'] ?? null) === 'rate_limited') {
                $this->error('Rate limited (429). Stopped; rerun later to continue.');
                break;
            }

            if (! $res['success']) {
                $failed[] = $exercise->name;
                $this->warn("  ! {$exercise->name}: request failed ({$res['error']}) — see storage/logs/laravel.log");

                continue;
            }

            if (! $hit) {
                $unmatched[] = $exercise->name;
                $this->line("  - {$exercise->name}: no match");

                continue;
            }

            if ($dryRun) {
                $matched++;
                $this->line("  + {$exercise->name} → {$hit['name']}");

                continue;
            }

            $path = $this->storeGif($client, $hit);
            if ($path === 'rate_limited') {
                $this->error('Rate limited (429) while downloading GIF. Stopped; rerun later to continue.');
                break;
            }
            if ($path === null) {
                $failed[] = $exercise->name;
                $this->warn("  ! {$exercise->name}: GIF download failed — see storage/logs/laravel.log");

                continue;
            }

            $matched++;
            $exercise->update(['gif_url' => $path]);
            $this->line("  + {$exercise->name} → {$hit['name']}");
        }

        $this->info(($dryRun ? 'Dry run: ' : 'Done: ')."{$matched} matched, ".count($unmatched).' unmatched, '.count($failed).' failed.');
        if ($unmatched !== []) {
            $this->line('Unmatched: '.implode(', ', $unmatched));
        }
        if ($failed !== []) {
            $this->line('Failed: '.implode(', ', $failed));
        }

        return $failed === [] ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Page through search results (10 per page on free plan) until an exact
     * match turns up, results run out, or --pages is reached.
     *
     * @return array{0:array<string,mixed>,1:array<string,mixed>|null}
     */
    private function find(WorkoutXClient $client, string $localName, string $term): array
    {
        $maxPages = max(1, (int) $this->option('pages'));
        $best = ['hit' => null, 'score' => 0.0];
        $res = ['success' => true, 'data' => []];

        for ($page = 0; $page < $maxPages; $page++) {
            $offset = $page * WorkoutXClient::PAGE_SIZE;
            $res = $this->search($client, $term, $offset);
            if (! $res['success']) {
                // Keep a hit from earlier pages rather than losing it to a later error.
                return [$best['hit'] ? ['success' => true, 'data' => []] : $res, $best['hit']];
            }

            $ranked = WorkoutXMatcher::rank($localName, $res['data']);
            if ($ranked['hit'] && $ranked['score'] > $best['score']) {
                $best = $ranked;
            }

            $total = (int) ($res['total'] ?? 0);
            if ($best['score'] >= WorkoutXMatcher::GOOD_ENOUGH || $offset + WorkoutXClient::PAGE_SIZE >= $total) {
                break;
            }
        }

        return [$res, $best['hit']];
    }

    /** @return array{success:bool,data:array<int,array<string,mixed>>,total?:int,error?:string} */
    private function search(WorkoutXClient $client, string $term, int $offset = 0): array
    {
        $this->throttle();

        return $client->searchByName($term, $offset);
    }

    /**
     * Download the GIF once into storage/app/public and return its public path.
     * The remote gifUrl needs the API key, so it can't be used by the browser.
     */
    private function storeGif(WorkoutXClient $client, array $hit): ?string
    {
        $id = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($hit['id'] ?? '')) ?: md5((string) $hit['gifUrl']);
        $file = self::DIR."/{$id}.gif";
        $disk = Storage::disk('public');

        if (! $disk->exists($file)) {
            $this->throttle();
            $gif = $client->downloadGif((string) $hit['gifUrl']);
            if ($gif['error'] === 'rate_limited') {
                return 'rate_limited';
            }
            if ($gif['body'] === null) {
                return null;
            }
            $disk->put($file, $gif['body']);
        }

        return '/storage/'.$file;
    }

    private function throttle(): void
    {
        $delayMs = max(0, (int) $this->option('delay'));
        if ($this->calls++ > 0 && $delayMs > 0) {
            usleep($delayMs * 1000);
        }
    }
}
