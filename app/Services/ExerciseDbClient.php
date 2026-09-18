<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Server-side client for ExerciseDB v2 (RapidAPI).
 *
 * The API key NEVER leaves the backend. Frontend only receives the final
 * public CDN URLs (videoUrl / imageUrls) stored on the exercises table.
 * Free/trial tier: watermarked media + strict rate limits — callers must
 * handle empty results gracefully (fallback placeholder in UI).
 */
class ExerciseDbClient
{
    public function configured(): bool
    {
        return (string) config('services.exercisedb.key') !== '';
    }

    /** @return array{baseUrl:string,host:string,timeout:int,cacheTtl:int} */
    private function cfg(): array
    {
        return [
            'baseUrl' => rtrim((string) config('services.exercisedb.base_url'), '/'),
            'host' => (string) config('services.exercisedb.host'),
            'timeout' => (int) config('services.exercisedb.timeout', 15),
            'cacheTtl' => (int) config('services.exercisedb.cache_ttl', 86400),
        ];
    }

    /** @return array<string,string> */
    private function headers(): array
    {
        $c = $this->cfg();

        return [
            'X-RapidAPI-Key' => (string) config('services.exercisedb.key'),
            'X-RapidAPI-Host' => $c['host'],
            'Accept' => 'application/json',
        ];
    }

    /**
     * @return array{success:bool,data:array,m.meta?:array}
     */
    public function search(string $term, int $limit = 20): array
    {
        $limit = max(1, min($limit, 100));
        $cacheKey = 'exercisedb:search:'.md5(mb_strtolower(trim($term)).':'.$limit);

        return Cache::remember($cacheKey, $this->cfg()['cacheTtl'], function () use ($term, $limit) {
            return $this->get('/api/v1/exercises/search', ['search' => $term, 'limit' => $limit]);
        });
    }

    /** @return array<string,mixed>|null */
    public function fetchById(string $exerciseId): ?array
    {
        $cacheKey = 'exercisedb:id:'.md5($exerciseId);

        $res = Cache::remember($cacheKey, $this->cfg()['cacheTtl'], function () use ($exerciseId) {
            return $this->get('/api/v1/exercises/'.$exerciseId);
        });

        $data = $res['data'] ?? null;

        return is_array($data) ? $data : null;
    }

    /**
     * Cursor-based list. Response shape: {success, meta:{nextCursor,...}, data:[...]}.
     *
     * @return array{success:bool,data:array,meta:array}
     */
    public function listPage(?string $cursor = null, int $limit = 50): array
    {
        $limit = max(1, min($limit, 100));
        $cacheKey = 'exercisedb:list:'.md5(($cursor ?? 'start').':'.$limit);

        return Cache::remember($cacheKey, $this->cfg()['cacheTtl'], function () use ($cursor, $limit) {
            $query = ['limit' => $limit];
            if ($cursor) {
                $query['cursor'] = $cursor;
            }

            $res = $this->get('/api/v1/exercises', $query);

            return [
                'success' => (bool) ($res['success'] ?? false),
                'data' => is_array($res['data'] ?? null) ? $res['data'] : [],
                'meta' => is_array($res['meta'] ?? null) ? $res['meta'] : [],
            ];
        });
    }

    /** @return array<string,mixed> */
    private function get(string $path, array $query = []): array
    {
        if (! $this->configured()) {
            return ['success' => false, 'data' => [], 'error' => 'missing_key'];
        }

        $c = $this->cfg();

        try {
            $response = Http::withHeaders($this->headers())
                ->timeout($c['timeout'])
                ->retry(2, 500, throw: false)
                ->get($c['baseUrl'].$path, $query);

            if ($response->status() === 429) {
                Log::warning('ExerciseDB rate limited (429).', ['path' => $path]);

                return ['success' => false, 'data' => [], 'error' => 'rate_limited'];
            }

            if ($response->failed()) {
                Log::warning('ExerciseDB request failed.', [
                    'path' => $path,
                    'status' => $response->status(),
                ]);

                return ['success' => false, 'data' => [], 'error' => 'http_'.$response->status()];
            }

            $json = $response->json();

            return is_array($json) ? $json : ['success' => false, 'data' => []];
        } catch (RequestException $e) {
            Log::warning('ExerciseDB request exception.', ['message' => $e->getMessage()]);

            return ['success' => false, 'data' => [], 'error' => 'exception'];
        }
    }
}
