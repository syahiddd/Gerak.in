<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Exercise;
use App\Services\ExerciseDatasetMapper;
use App\Services\WorkoutXMatcher;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Signature('exercises:import-dataset {--source= : Path to a local clone of hasaneyldrm/exercises-dataset (default: download from GitHub)} {--no-media : Import data only, skip GIF/image files} {--limit= : Only the first N records (for a trial run)} {--concurrency=8 : Parallel media downloads}')]
#[Description('Import exercises + animations from hasaneyldrm/exercises-dataset (data MIT, media © Gym visual).')]
class ImportExerciseDataset extends Command
{
    /** Media lives under storage/app/public/exercise-dataset/{videos,images}. */
    private const DIR = 'exercise-dataset';

    private int $downloaded = 0;

    private int $mediaSkipped = 0;

    /** @var string[] */
    private array $mediaFailed = [];

    public function handle(ExerciseDatasetMapper $mapper): int
    {
        $records = $this->loadRecords();
        if ($records === null) {
            return self::FAILURE;
        }

        if ($limit = (int) $this->option('limit')) {
            $records = array_slice($records, 0, max(1, $limit));
        }
        $this->info('Records: '.count($records));

        if (! $this->option('no-media')) {
            $this->fetchMedia($records);
        }

        $stats = DB::transaction(fn () => $this->upsert($records, $mapper));

        $this->newLine();
        $this->info("Done: {$stats['created']} created, {$stats['linked']} linked to existing exercises, {$stats['updated']} updated, {$stats['skipped']} skipped.");
        if (! $this->option('no-media')) {
            $this->line("Media: {$this->downloaded} downloaded, {$this->mediaSkipped} already present, ".count($this->mediaFailed).' failed.');
            if ($this->mediaFailed !== []) {
                $this->warn('Failed media (rerun to retry): '.implode(', ', array_slice($this->mediaFailed, 0, 10)).(count($this->mediaFailed) > 10 ? ' …' : ''));
            }
        }
        $this->line('Attribution required wherever these animations are shown: © Gym visual — https://gymvisual.com/');

        return self::SUCCESS;
    }

    /** @return array<int,array<string,mixed>>|null */
    private function loadRecords(): ?array
    {
        $source = $this->option('source');
        $json = $source
            ? @file_get_contents(rtrim((string) $source, '/\\').'/data/exercises.json')
            : $this->download('data/exercises.json');

        $records = is_string($json) ? json_decode($json, true) : null;
        if (! is_array($records) || ! array_is_list($records)) {
            $this->error('Could not read data/exercises.json'.($source ? " from {$source}" : ' from GitHub').'.');

            return null;
        }

        return array_values(array_filter($records, fn ($r) => is_array($r) && isset($r['id'], $r['name'])));
    }

    /** @param array<int,array<string,mixed>> $records */
    private function fetchMedia(array $records): void
    {
        $disk = Storage::disk('public');
        $missing = [];
        foreach ($records as $r) {
            foreach (['gif_url', 'image'] as $key) {
                $rel = $this->safePath($r[$key] ?? null);
                if (! $rel) {
                    continue;
                }
                if ($disk->exists(self::DIR.'/'.$rel)) {
                    $this->mediaSkipped++;
                } else {
                    $missing[] = $rel;
                }
            }
        }

        if ($missing === []) {
            return;
        }

        if ($source = $this->option('source')) {
            foreach ($missing as $rel) {
                $bytes = @file_get_contents(rtrim((string) $source, '/\\').'/'.$rel);
                $bytes !== false ? $this->store($rel, $bytes) : $this->mediaFailed[] = $rel;
            }

            return;
        }

        $this->line('Downloading '.count($missing).' media files…');
        $bar = $this->output->createProgressBar(count($missing));
        $concurrency = max(1, (int) $this->option('concurrency'));

        foreach (array_chunk($missing, $concurrency) as $batch) {
            $responses = Http::pool(fn (Pool $pool) => array_map(
                fn (string $rel) => $pool->as($rel)->timeout(30)->get($this->url($rel)),
                $batch,
            ));

            foreach ($batch as $rel) {
                $res = $responses[$rel] ?? null;
                $ok = $res instanceof Response && $res->successful() && $res->body() !== '';
                // One sequential retry for transient failures.
                $bytes = $ok ? $res->body() : $this->download($rel);
                $bytes !== null ? $this->store($rel, $bytes) : $this->mediaFailed[] = $rel;
                $bar->advance();
            }
        }
        $bar->finish();
        $this->newLine();
    }

    /**
     * @param  array<int,array<string,mixed>>  $records
     * @return array{created:int,linked:int,updated:int,skipped:int}
     */
    private function upsert(array $records, ExerciseDatasetMapper $mapper): array
    {
        $stats = ['created' => 0, 'linked' => 0, 'updated' => 0, 'skipped' => 0];
        $disk = Storage::disk('public');

        $byExternal = Exercise::withTrashed()->whereNotNull('external_id')->get()->keyBy('external_id');
        $slugs = Exercise::withTrashed()->pluck('slug')->flip()->all();

        // Local (hand-seeded / other-source) exercises, keyed by normalized name and by
        // the verified WorkoutX alias ("Back Squat" -> "barbell full squat"): same vocabulary.
        $locals = [];
        foreach (Exercise::where('is_system', true)->where(fn ($q) => $q->whereNull('external_id')->orWhere('external_id', 'not like', ExerciseDatasetMapper::EXTERNAL_PREFIX.'%'))->get() as $ex) {
            $locals[WorkoutXMatcher::normalize($ex->name)] ??= $ex;
            $locals[WorkoutXMatcher::normalize(WorkoutXMatcher::target($ex->name))] ??= $ex;
        }
        $linkedLocalIds = [];

        foreach ($records as $raw) {
            $attrs = $mapper->map($raw);
            $media = $this->mediaAttributes($raw, $disk);

            $existing = $byExternal[$attrs['external_id']] ?? null;
            if ($existing?->trashed()) {
                $stats['skipped']++; // deleted on purpose by an admin; leave it gone

                continue;
            }

            // Re-runs and name matches never overwrite: only empty fields get filled,
            // so local names and WorkoutX GIFs survive and failed media can be retried.
            if ($existing) {
                $fill = $this->fillGaps($existing, $attrs, $media);
                if ($fill === []) {
                    $stats['skipped']++;
                } else {
                    $existing->update($fill);
                    $stats['updated']++;
                }

                continue;
            }

            $local = $locals[WorkoutXMatcher::normalize((string) $raw['name'])] ?? null;
            if ($local && ! isset($linkedLocalIds[$local->id]) && ! $local->external_id) {
                $linkedLocalIds[$local->id] = true;
                $local->update(['external_id' => $attrs['external_id']] + $this->fillGaps($local, $attrs, $media));
                $byExternal[$attrs['external_id']] = $local;
                $stats['linked']++;

                continue;
            }

            $slug = $base = Str::slug($attrs['name']) ?: 'exercise';
            for ($i = 2; isset($slugs[$slug]); $i++) {
                $slug = $base.'-'.$i;
            }
            $slugs[$slug] = true;

            $created = Exercise::create($attrs + $media + ['slug' => $slug]);
            $byExternal[$attrs['external_id']] = $created;
            $stats['created']++;
        }

        return $stats;
    }

    /**
     * Only fill what is empty. Name, slug and an existing GIF (e.g. WorkoutX)
     * always stay; the dataset GIF is used only when the exercise has none.
     *
     * @return array<string,mixed>
     */
    private function fillGaps(Exercise $exercise, array $attrs, array $media): array
    {
        $fill = [];
        foreach (['instructions', 'primary_muscle_id', 'equipment_id', 'secondary_muscle_ids'] as $field) {
            if (empty($exercise->{$field}) && ! empty($attrs[$field])) {
                $fill[$field] = $attrs[$field];
            }
        }
        if (! $exercise->image_url && isset($media['image_url'])) {
            $fill['image_url'] = $media['image_url'];
        }
        if (! $exercise->gif_url && isset($media['gif_url'])) {
            $fill['gif_url'] = $media['gif_url'];
            $fill['media_source'] = ExerciseDatasetMapper::SOURCE;
        }

        return $fill;
    }

    /** @return array<string,string> gif_url/image_url for files that are actually on disk */
    private function mediaAttributes(array $raw, $disk): array
    {
        $out = [];
        foreach (['gif_url' => 'gif_url', 'image' => 'image_url'] as $key => $column) {
            $rel = $this->safePath($raw[$key] ?? null);
            if ($rel && $disk->exists(self::DIR.'/'.$rel)) {
                $out[$column] = '/storage/'.self::DIR.'/'.$rel;
            }
        }

        return $out;
    }

    /** Accept only "videos/…gif" / "images/…jpg" style paths from the JSON (no traversal). */
    private function safePath(mixed $path): ?string
    {
        return is_string($path) && preg_match('#^(videos|images)/[A-Za-z0-9._-]+\.(gif|jpe?g|png)$#', $path) ? $path : null;
    }

    private function url(string $rel): string
    {
        return rtrim((string) config('services.exercise_dataset.base_url'), '/').'/'.$rel;
    }

    private function download(string $rel): ?string
    {
        $res = Http::timeout(60)->retry(2, 500, throw: false)->get($this->url($rel));

        return $res->successful() && $res->body() !== '' ? $res->body() : null;
    }

    private function store(string $rel, string $bytes): void
    {
        Storage::disk('public')->put(self::DIR.'/'.$rel, $bytes);
        $this->downloaded++;
    }
}
