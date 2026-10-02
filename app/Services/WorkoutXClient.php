<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Server-side client for WorkoutX (https://api.workoutxapp.com).
 *
 * The API key stays on the backend. gifUrl also requires the key and every
 * GIF fetch costs quota, so GIFs are downloaded once and served locally.
 * Free tier: 500 req/month, 30 req/min — successful responses are cached
 * for a long time so re-runs do not burn quota.
 */
class WorkoutXClient
{
    public function configured(): bool
    {
        return (string) config('services.workoutx.key') !== '';
    }

    /** Free plan returns at most 10 results per request. */
    public const PAGE_SIZE = 10;

    /**
     * Substring search on exercise name, one page at a time.
     *
     * @return array{success:bool,data:array<int,array<string,mixed>>,total?:int,error?:string}
     */
    public function searchByName(string $name, int $offset = 0): array
    {
        $term = mb_strtolower(trim($name));
        $cacheKey = 'workoutx:name:'.md5($term.':'.$offset);

        if (($cached = Cache::get($cacheKey)) !== null) {
            return $cached;
        }

        $res = $this->get('/v1/exercises/name/'.rawurlencode($term), ['limit' => self::PAGE_SIZE, 'offset' => $offset]);

        // Only cache successes so a 429 can be retried later.
        if ($res['success']) {
            Cache::put($cacheKey, $res, (int) config('services.workoutx.cache_ttl', 2592000));
        }

        return $res;
    }

    /**
     * Download a GIF (binary). gifUrl requires the API key, same as JSON calls.
     *
     * @return array{body:?string,error:?string}
     */
    public function downloadGif(string $url): array
    {
        if (! $this->configured()) {
            return ['body' => null, 'error' => 'missing_key'];
        }

        try {
            $response = $this->http('image/gif')->get($url);

            if ($response->status() === 429) {
                return ['body' => null, 'error' => 'rate_limited'];
            }

            $body = $response->body();
            if ($response->failed() || ! str_starts_with($body, 'GIF8')) {
                // e.g. 503 "Watermarked GIF Unavailable" on the free plan for some newer GIFs.
                Log::warning('WorkoutX GIF download failed.', [
                    'url' => $url,
                    'status' => $response->status(),
                    'message' => $response->json('message') ?? mb_substr($body, 0, 200),
                ]);

                return ['body' => null, 'error' => 'http_'.$response->status()];
            }

            return ['body' => $body, 'error' => null];
        } catch (ConnectionException|RequestException $e) {
            Log::warning('WorkoutX GIF download exception.', ['message' => $e->getMessage()]);

            return ['body' => null, 'error' => 'exception'];
        }
    }

    private function http(string $accept): PendingRequest
    {
        return Http::withHeaders([
            'X-WorkoutX-Key' => (string) config('services.workoutx.key'),
            'Accept' => $accept,
        ])->timeout((int) config('services.workoutx.timeout', 15));
    }

    /**
     * @return array{success:bool,data:array<int,array<string,mixed>>,total?:int,error?:string}
     */
    private function get(string $path, array $query = []): array
    {
        if (! $this->configured()) {
            return ['success' => false, 'data' => [], 'error' => 'missing_key'];
        }

        try {
            $response = $this->http('application/json')
                ->get(rtrim((string) config('services.workoutx.base_url'), '/').$path, $query);

            if ($response->status() === 429) {
                Log::warning('WorkoutX rate limited (429).', ['path' => $path]);

                return ['success' => false, 'data' => [], 'error' => 'rate_limited'];
            }

            if ($response->status() === 404) {
                return ['success' => true, 'data' => []];
            }

            if ($response->failed()) {
                Log::warning('WorkoutX request failed.', ['path' => $path, 'status' => $response->status()]);

                return ['success' => false, 'data' => [], 'error' => 'http_'.$response->status()];
            }

            $json = $response->json();
            // Accept both a bare array and a {data:[...]} envelope.
            $items = is_array($json['data'] ?? null) ? $json['data'] : (is_array($json) && array_is_list($json) ? $json : []);

            $items = array_values(array_filter($items, 'is_array'));

            return ['success' => true, 'data' => $items, 'total' => (int) ($json['total'] ?? count($items))];
        } catch (ConnectionException|RequestException $e) {
            Log::warning('WorkoutX request exception.', ['message' => $e->getMessage()]);

            return ['success' => false, 'data' => [], 'error' => 'exception'];
        }
    }
}
