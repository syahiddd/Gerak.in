<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

/**
 * Where user uploads (workout photos, avatars) live.
 *
 * Locally that is the public disk. Vercel's filesystem is read-only, so production sets
 * MEDIA_DISK=supabase and files go to a public Supabase Storage bucket over its REST API,
 * which avoids pulling in the AWS SDK for three calls.
 */
class MediaStorage
{
    /** Failures become a form error that names the cause (never a key), so a broken setup is diagnosable. */
    public static function put(string $path, string $bytes, string $mime, string $field): void
    {
        $fail = function (string $reason, ?Throwable $e = null) use ($field): never {
            if ($e) {
                report($e);
            }

            throw ValidationException::withMessages([$field => "The photo could not be saved: {$reason}"]);
        };

        if (! self::usesSupabase()) {
            try {
                $stored = Storage::disk('public')->put($path, $bytes);
            } catch (Throwable $e) {
                $fail('the server disk is read-only. Set MEDIA_DISK=supabase and redeploy.', $e);
            }
            $stored || $fail('the server disk refused the file.');

            return;
        }

        $missing = array_keys(array_filter([
            'SUPABASE_URL' => config('services.supabase.url'),
            'SUPABASE_SECRET_KEY' => config('services.supabase.key'),
            'SUPABASE_STORAGE_BUCKET' => config('services.supabase.bucket'),
        ], fn ($v) => blank($v)));
        if ($missing !== []) {
            $fail('Supabase Storage is not configured ('.implode(', ', $missing).' is empty).');
        }

        try {
            $response = self::supabase()
                ->withBody($bytes, $mime)
                ->withHeaders(['x-upsert' => 'true', 'cache-control' => 'max-age=31536000'])
                ->post(self::objectUrl($path));
        } catch (ConnectionException $e) {
            $fail('Supabase Storage could not be reached. Check SUPABASE_URL.', $e);
        }

        if ($response->failed()) {
            $detail = Str::limit((string) ($response->json('message') ?? $response->json('error') ?? $response->body()), 120);
            report(new RuntimeException("Supabase Storage upload failed ({$response->status()}): {$detail}"));
            $fail("Supabase Storage replied \"{$detail}\" (HTTP {$response->status()}).");
        }
    }

    /** Best effort: a leftover file only costs storage, so it never blocks the user. */
    public static function delete(string $path): void
    {
        try {
            self::usesSupabase()
                ? self::supabase()->delete(self::objectUrl($path))
                : Storage::disk('public')->delete($path);
        } catch (Throwable $e) {
            report($e);
        }
    }

    public static function url(string $path): string
    {
        if (! self::usesSupabase()) {
            // Relative, so it works whatever host the app is served from.
            return '/storage/'.$path;
        }

        return self::base().'/storage/v1/object/public/'.config('services.supabase.bucket').'/'.$path;
    }

    private static function usesSupabase(): bool
    {
        return config('services.supabase.media_disk') === 'supabase';
    }

    private static function objectUrl(string $path): string
    {
        return self::base().'/storage/v1/object/'.config('services.supabase.bucket').'/'.$path;
    }

    private static function base(): string
    {
        return rtrim((string) config('services.supabase.url'), '/');
    }

    private static function supabase(): PendingRequest
    {
        $key = (string) config('services.supabase.key');
        $request = Http::timeout(20)->withHeaders(['apikey' => $key]);

        // Legacy service_role keys are JWTs and must also go in Authorization; new sb_secret_ keys must not.
        return str_starts_with($key, 'eyJ') ? $request->withToken($key) : $request;
    }
}
