<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Picks the WorkoutX result that best matches a local exercise name.
 *
 * WorkoutX search is a case-insensitive substring match on the name, sorted
 * alphabetically, 10 per page on the free plan. Names often carry qualifiers
 * ("Pull Up (neutral Grip)") or differ from common gym names ("Barbell Bent
 * Over Row"), so ALIASES pins the canonical WorkoutX name for known lifts.
 *
 * Ranking: exact > exact ignoring (...) > contains every local word (fewer
 * extra words wins, variant words penalised) > very close spelling. Anything
 * weaker returns null so we never attach a wrong animation.
 */
class WorkoutXMatcher
{
    public const THRESHOLD = 60.0;

    /** Score at which paging through more results stops. */
    public const GOOD_ENOUGH = 95.0;

    /** Normalized local name => exact WorkoutX name (verified against the API). */
    private const ALIASES = [
        'push up' => 'Push-up',
        'pull up' => 'Pull-up',
        'chin up' => 'Chin-up',
        'back squat' => 'Barbell Full Squat',
        'barbell row' => 'Barbell Bent Over Row',
        'one arm dumbbell row' => 'Dumbbell One Arm Bent-over Row',
        'seated cable row' => 'Cable Seated Row',
        'dumbbell curl' => 'Dumbbell Biceps Curl',
        'hammer curl' => 'Dumbbell Hammer Curl',
        'incline dumbbell press' => 'Dumbbell Incline Bench Press',
        'incline barbell press' => 'Barbell Incline Bench Press',
        'close grip bench press' => 'Barbell Close-grip Bench Press',
        'arnold press' => 'Dumbbell Arnold Press',
        'lateral raise' => 'Dumbbell Lateral Raise',
        'lat pulldown' => 'Cable Bar Lateral Pulldown',
        'cable fly' => 'Cable Standing Fly',
        'tricep pushdown' => 'Cable Pushdown',
        'skullcrusher' => 'Barbell Lying Triceps Extension Skull Crusher',
        'leg press' => 'Sled 45° Leg Press',
        'side plank' => 'Side Bridge V. 2',
        'farmer carry' => 'Farmers Walk',
        't bar row' => 'Lever T Bar Row',
    ];

    /** Words that turn an exercise into a noticeably different variant. */
    private const VARIANT_WORDS = [
        'incline', 'decline', 'clap', 'plyo', 'jump', 'knee', 'female', 'male', 'reverse',
        'one', 'single', 'band', 'resistance', 'assisted', 'adduction', 'abduction', 'smith',
        'bosu', 'ball', 'weighted', 'kneeling', 'wide', 'close', 'narrow', 'sumo', 'alternate',
    ];

    /** Leading words dropped for the fallback search ("Barbell Row" -> "row"). */
    private const MODIFIERS = [
        'barbell', 'dumbbell', 'cable', 'kettlebell', 'machine', 'one', 'arm', 'single',
        'seated', 'standing', 'lying', 'incline', 'decline', 'close', 'grip', 'weighted',
    ];

    public static function normalize(string $name): string
    {
        $n = mb_strtolower($name);
        $n = str_replace(["'s", '’s'], '', $n);
        $n = preg_replace('/[^a-z0-9]+/', ' ', $n) ?? $n;
        $n = trim(preg_replace('/\s+/', ' ', $n) ?? $n);

        // Naive singular so "thrusts"/"raises" match "thrust"/"raise"; applied to both sides.
        return preg_replace('/(?<!s)s\b/', '', $n) ?? $n;
    }

    /** The name we are actually looking for on WorkoutX. */
    public static function target(string $localName): string
    {
        return self::ALIASES[self::normalize($localName)] ?? $localName;
    }

    /**
     * Search term to send to the API. Keeps hyphens because WorkoutX
     * search is literal ("chin up" finds nothing, "chin-up" does).
     */
    public static function searchTerm(string $localName): string
    {
        $t = mb_strtolower(self::target($localName));
        $t = str_replace(["'s", '’s'], '', $t);

        return trim(preg_replace('/\s+/', ' ', $t) ?? $t);
    }

    /** Broader term used when the first search finds nothing usable. */
    public static function fallbackTerm(string $localName): ?string
    {
        $full = self::normalize(self::target($localName));
        $words = explode(' ', $full);
        while (count($words) > 1 && in_array($words[0], self::MODIFIERS, true)) {
            array_shift($words);
        }
        $term = implode(' ', $words);

        return $term !== $full ? $term : null;
    }

    public static function score(string $localName, string $candidateName): float
    {
        $target = self::normalize(self::target($localName));
        $full = self::normalize($candidateName);
        if ($full === $target) {
            return 100.0;
        }

        $base = self::normalize(preg_replace('/\(.*?\)/', ' ', $candidateName) ?? $candidateName);
        if ($base === $target) {
            return 95.0;
        }

        $t = explode(' ', $target);
        $c = explode(' ', $full);
        if (array_diff($t, $c) === []) {
            // Every local word present; penalise extra words, more so if they make it a variant.
            $variants = count(array_intersect(array_diff($c, $t), self::VARIANT_WORDS));

            return 60.0 + 30.0 * count($t) / max(count($c), 1) - 8.0 * $variants;
        }

        similar_text($target, $base, $pct);

        return $pct >= 90.0 ? $pct * 0.8 : 0.0;
    }

    /**
     * @param  array<int,array<string,mixed>>  $candidates
     * @return array{hit:array<string,mixed>|null,score:float}
     */
    public static function rank(string $localName, array $candidates): array
    {
        $best = null;
        $bestScore = 0.0;

        foreach ($candidates as $c) {
            if (! is_string($c['name'] ?? null) || ! is_string($c['gifUrl'] ?? null) || $c['gifUrl'] === '') {
                continue;
            }
            $s = self::score($localName, $c['name']);
            if ($s > $bestScore) {
                $bestScore = $s;
                $best = $c;
            }
        }

        return $bestScore >= self::THRESHOLD ? ['hit' => $best, 'score' => $bestScore] : ['hit' => null, 'score' => $bestScore];
    }

    /**
     * @param  array<int,array<string,mixed>>  $candidates
     * @return array<string,mixed>|null
     */
    public static function best(string $localName, array $candidates): ?array
    {
        return self::rank($localName, $candidates)['hit'];
    }
}
