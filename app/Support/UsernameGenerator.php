<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Builds a unique @username from a display name ("Syahid Amanullah" -> "syahid_amanullah",
 * then "syahid_amanullah2" on collision). Matches the PATTERN users can pick later.
 */
class UsernameGenerator
{
    public const PATTERN = '/^[a-z0-9_.]{3,30}$/';

    public static function generate(string $name, ?int $ignoreUserId = null): string
    {
        $base = Str::of(Str::ascii($name))->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->limit(24, '')
            ->toString();

        if (strlen($base) < 3) {
            $base = 'user'.$base;
        }

        $candidate = $base;
        $i = 2;
        while (self::taken($candidate, $ignoreUserId)) {
            $candidate = $base.$i++;
        }

        return $candidate;
    }

    private static function taken(string $username, ?int $ignoreUserId): bool
    {
        return DB::table('users')
            ->where('username', $username)
            ->when($ignoreUserId, fn ($q) => $q->where('id', '!=', $ignoreUserId))
            ->exists();
    }
}
