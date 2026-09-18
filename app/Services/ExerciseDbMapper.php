<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExerciseType;
use App\Models\Equipment;
use App\Models\Muscle;
use Illuminate\Support\Str;

/**
 * Maps raw ExerciseDB v2 payloads to the local exercises schema.
 *
 * EDB enums are coarse (STRENGTH/CARDIO/...) while local ExerciseType is
 * granular (weight_reps/bodyweight_reps/...). Muscles/equipment are matched
 * best-effort via slug lookup + synonym tables; unmapped values stay null
 * and are reported so an admin can curate them later.
 */
class ExerciseDbMapper
{
    /** @return array<string,mixed> Local attributes + _unmapped report. */
    public static function map(array $raw): array
    {
        $name = (string) ($raw['name'] ?? 'Untitled exercise');
        $externalId = (string) ($raw['exerciseId'] ?? '');

        $instructions = $raw['instructions'] ?? null;
        $instructionsText = is_array($instructions) ? implode("\n", array_map('strval', $instructions)) : (is_string($instructions) ? $instructions : null);

        $imageUrls = $raw['imageUrls'] ?? null;
        if (! is_array($imageUrls)) {
            $imageUrls = null;
        }

        $bodyParts = self::strList($raw['bodyParts'] ?? []);
        $targetMuscles = self::strList($raw['targetMuscles'] ?? []);
        $equipments = self::strList($raw['equipments'] ?? []);

        $muscleSlug = self::resolveMuscleSlug($bodyParts, $targetMuscles);
        $equipmentSlug = self::resolveEquipmentSlug($equipments);

        $muscleId = $muscleSlug ? Muscle::where('slug', $muscleSlug)->value('id') : null;
        $equipmentId = $equipmentSlug ? Equipment::where('slug', $equipmentSlug)->value('id') : null;

        // Unique slug that never collides with the 46 hand-seeded locals.
        $suffix = $externalId !== '' ? '-'.Str::lower(substr(preg_replace('/[^A-Za-z0-9]/', '', $externalId) ?? '', -6)) : '-'.Str::lower(Str::random(6));

        return [
            'name' => $name,
            'slug' => Str::slug($name).$suffix,
            'external_id' => $externalId !== '' ? $externalId : null,
            'description' => isset($raw['overview']) && is_string($raw['overview']) ? $raw['overview'] : null,
            'overview' => isset($raw['overview']) && is_string($raw['overview']) ? $raw['overview'] : null,
            'instructions' => $instructionsText,
            'exercise_tips' => self::strListOrNull($raw['exerciseTips'] ?? null),
            'variations' => self::strListOrNull($raw['variations'] ?? null),
            'related_exercise_ids' => self::strListOrNull($raw['relatedExerciseIds'] ?? null),
            'keywords' => self::strListOrNull($raw['keywords'] ?? null),
            'equipment_id' => $equipmentId,
            'primary_muscle_id' => $muscleId,
            'secondary_muscle_ids' => null,
            'exercise_type' => self::resolveType($raw)->value,
            'image_url' => isset($raw['imageUrl']) && is_string($raw['imageUrl']) ? $raw['imageUrl'] : null,
            'image_urls' => $imageUrls,
            'video_url' => isset($raw['videoUrl']) && is_string($raw['videoUrl']) ? $raw['videoUrl'] : null,
            'media_source' => 'exercisedb',
            'is_system' => true,
            'created_by' => null,
            '_unmapped' => [
                'muscle' => $muscleId ? null : implode(',', array_merge($bodyParts, $targetMuscles)),
                'equipment' => $equipmentId ? null : implode(',', $equipments),
            ],
        ];
    }

    public static function resolveType(array $raw): ExerciseType
    {
        $t = strtoupper((string) ($raw['exerciseType'] ?? 'STRENGTH'));
        $equip = implode(' ', self::strList($raw['equipments'] ?? []));

        return match ($t) {
            'CARDIO' => ExerciseType::DistanceDuration,
            'STRETCHING', 'YOGA', 'PILATES' => ExerciseType::Duration,
            default => str_contains(strtoupper($equip), 'BODYWEIGHT') || str_contains(strtoupper($equip), 'BODY WEIGHT')
                ? ExerciseType::BodyweightReps
                : ExerciseType::WeightReps,
        };
    }

    /** @param string[] $bodyParts @param string[] $targets */
    public static function resolveMuscleSlug(array $bodyParts, array $targets): ?string
    {
        // 1) Direct body-part match (CHEST -> chest).
        foreach ($bodyParts as $bp) {
            $slug = Str::slug($bp);
            if (Muscle::where('slug', $slug)->exists()) {
                return $slug;
            }
        }

        // 2) Anatomical keyword match (Pectoralis Major ... -> chest).
        $haystack = mb_strtolower(implode(' ', array_merge($bodyParts, $targets)));
        $synonyms = [
            'chest' => ['pectoral', 'chest'],
            'shoulders' => ['deltoid', 'shoulder'],
            'lats' => ['latissimus', 'lats'],
            'back' => ['trapezius', 'rhomboid', 'erector', 'back'],
            'traps' => ['trap'],
            'biceps' => ['biceps', 'brachialis'],
            'triceps' => ['triceps'],
            'forearms' => ['forearm', 'brachioradialis'],
            'quadriceps' => ['quadriceps', 'quad'],
            'hamstrings' => ['hamstring'],
            'glutes' => ['glute'],
            'calves' => ['calf', 'gastrocnemius', 'soleus'],
            'core' => ['abdominal', 'rectus abdominis', 'oblique', 'core'],
        ];
        foreach ($synonyms as $slug => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($haystack, $kw)) {
                    return $slug;
                }
            }
        }

        return null;
    }

    /** @param string[] $equipments */
    public static function resolveEquipmentSlug(array $equipments): ?string
    {
        foreach ($equipments as $eq) {
            $slug = Str::slug($eq); // "BODY WEIGHT" -> "body-weight"
            $slug = str_replace('body-weight', 'bodyweight', $slug);
            if (Equipment::where('slug', $slug)->exists()) {
                return $slug;
            }
        }

        $hay = mb_strtolower(implode(' ', $equipments));
        $synonyms = [
            'barbell' => ['barbell'],
            'dumbbell' => ['dumbbell'],
            'cable' => ['cable'],
            'kettlebell' => ['kettlebell'],
            'bodyweight' => ['body weight', 'bodyweight', 'assisted', 'none'],
            'machine' => ['machine', 'lever', 'smith'],
            'pull-up-bar' => ['pull-up', 'pullup', 'chin-up'],
            'ez-bar' => ['ez', 'curl bar'],
            'treadmill' => ['treadmill'],
            'rower' => ['rower', 'rowing'],
        ];
        foreach ($synonyms as $slug => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($hay, $kw)) {
                    return Equipment::where('slug', $slug)->exists() ? $slug : null;
                }
            }
        }

        return null;
    }

    /** @return string[] */
    private static function strList(mixed $v): array
    {
        if (! is_array($v)) {
            return [];
        }

        return array_values(array_filter(array_map(fn ($x) => is_string($x) ? trim($x) : null, $v)));
    }

    /** @return string[]|null */
    private static function strListOrNull(mixed $v): ?array
    {
        $list = self::strList($v);

        return $list === [] ? null : $list;
    }
}
