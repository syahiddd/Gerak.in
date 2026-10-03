<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExerciseType;
use App\Models\Equipment;
use App\Models\Muscle;
use Illuminate\Support\Str;

/**
 * Maps one record of hasaneyldrm/exercises-dataset (data/exercises.json) to the
 * local exercises schema. The dataset uses ExerciseDB-style vocabulary
 * ("pectorals", "delts", "leverage machine"), mapped here to our 13 muscles and
 * 12 equipment slugs. Values with no sensible local equivalent map to null.
 *
 * Data is MIT; the media it points to is © Gym visual and needs attribution.
 */
class ExerciseDatasetMapper
{
    public const SOURCE = 'gymvisual';

    public const EXTERNAL_PREFIX = 'gv:';

    /** Dataset `target` / `secondary_muscles` / `muscle_group` value => local muscle slug. */
    private const MUSCLES = [
        'pectorals' => 'chest', 'chest' => 'chest', 'upper chest' => 'chest',
        'delts' => 'shoulders', 'deltoids' => 'shoulders', 'shoulders' => 'shoulders', 'rear deltoids' => 'shoulders', 'rotator cuff' => 'shoulders',
        'lats' => 'lats', 'latissimus dorsi' => 'lats',
        'upper back' => 'back', 'spine' => 'back', 'lower back' => 'back', 'back' => 'back', 'rhomboids' => 'back',
        'traps' => 'traps', 'trapezius' => 'traps', 'levator scapulae' => 'traps',
        'biceps' => 'biceps', 'brachialis' => 'biceps',
        'triceps' => 'triceps',
        'forearms' => 'forearms', 'wrist flexors' => 'forearms', 'wrist extensors' => 'forearms', 'wrists' => 'forearms', 'grip muscles' => 'forearms', 'hands' => 'forearms',
        'quads' => 'quadriceps', 'quadriceps' => 'quadriceps', 'adductors' => 'quadriceps', 'inner thighs' => 'quadriceps', 'groin' => 'quadriceps',
        'hamstrings' => 'hamstrings',
        'glutes' => 'glutes', 'abductors' => 'glutes',
        'calves' => 'calves', 'soleus' => 'calves', 'ankles' => 'calves', 'ankle stabilizers' => 'calves', 'shins' => 'calves', 'feet' => 'calves',
        'abs' => 'core', 'abdominals' => 'core', 'lower abs' => 'core', 'obliques' => 'core', 'core' => 'core', 'serratus anterior' => 'core', 'hip flexors' => 'core',
    ];

    /** Fallback when `target` is unmapped (e.g. "cardiovascular system"). */
    private const BODY_PARTS = [
        'chest' => 'chest', 'back' => 'back', 'shoulders' => 'shoulders', 'upper arms' => null,
        'lower arms' => 'forearms', 'upper legs' => 'quadriceps', 'lower legs' => 'calves', 'waist' => 'core',
        'neck' => 'traps', 'cardio' => null,
    ];

    private const EQUIPMENT = [
        'body weight' => 'bodyweight', 'assisted' => 'bodyweight', 'weighted' => 'bodyweight',
        'barbell' => 'barbell', 'olympic barbell' => 'barbell', 'trap bar' => 'barbell',
        'ez barbell' => 'ez-bar',
        'dumbbell' => 'dumbbell',
        'cable' => 'cable', 'rope' => 'cable',
        'kettlebell' => 'kettlebell',
        'band' => 'resistance-band', 'resistance band' => 'resistance-band',
        'leverage machine' => 'machine', 'smith machine' => 'machine', 'sled machine' => 'machine',
        'stationary bike' => 'machine', 'elliptical machine' => 'machine', 'stepmill machine' => 'machine',
        'skierg machine' => 'rower', 'upper body ergometer' => 'machine',
    ];

    /** @var array<string,int>|null slug => id, loaded once per mapper instance */
    private ?array $muscleIds = null;

    /** @var array<string,int>|null */
    private ?array $equipmentIds = null;

    /** @return array<string,mixed> attributes for Exercise (no slug; the importer assigns a unique one) */
    public function map(array $raw): array
    {
        $target = $this->clean($raw['target'] ?? '');
        $bodyPart = $this->clean($raw['body_part'] ?? $raw['category'] ?? '');
        $equipment = $this->clean($raw['equipment'] ?? '');

        $primarySlug = self::MUSCLES[$target] ?? self::BODY_PARTS[$bodyPart] ?? null;
        $primaryId = $primarySlug ? $this->muscleId($primarySlug) : null;

        $secondary = collect(is_array($raw['secondary_muscles'] ?? null) ? $raw['secondary_muscles'] : [])
            ->map(fn ($m) => self::MUSCLES[$this->clean((string) $m)] ?? null)
            ->filter()
            ->map(fn (string $slug) => $this->muscleId($slug))
            ->filter(fn ($id) => $id && $id !== $primaryId)
            ->unique()
            ->values()
            ->all();

        $equipmentSlug = self::EQUIPMENT[$equipment] ?? ExerciseDbMapper::resolveEquipmentSlug([$equipment]);

        $steps = $raw['instruction_steps']['en'] ?? null;
        $instructions = is_array($steps)
            ? implode("\n", array_map('trim', array_filter($steps, 'is_string')))
            : (is_string($raw['instructions']['en'] ?? null) ? $raw['instructions']['en'] : null);

        return [
            'name' => self::titleCase((string) ($raw['name'] ?? 'Untitled exercise')),
            'external_id' => self::EXTERNAL_PREFIX.($raw['id'] ?? ''),
            'instructions' => $instructions ?: null,
            'exercise_type' => self::resolveType($bodyPart, $equipment)->value,
            'primary_muscle_id' => $primaryId,
            'secondary_muscle_ids' => $secondary === [] ? null : $secondary,
            'equipment_id' => $equipmentSlug ? $this->equipmentId($equipmentSlug) : null,
            'media_source' => self::SOURCE,
            'is_system' => true,
            'created_by' => null,
        ];
    }

    public static function resolveType(string $bodyPart, string $equipment): ExerciseType
    {
        return match (true) {
            $bodyPart === 'cardio' => ExerciseType::Duration,
            $equipment === 'assisted' => ExerciseType::AssistedBodyweight,
            $equipment === 'weighted' => ExerciseType::WeightedBodyweight,
            $equipment === 'body weight' => ExerciseType::BodyweightReps,
            default => ExerciseType::WeightReps,
        };
    }

    /** "3/4 sit-up" → "3/4 Sit-Up", "push-up (on stability ball)" → "Push-Up (On Stability Ball)". */
    public static function titleCase(string $name): string
    {
        return (string) preg_replace_callback(
            '/(^|[\s\-\/(])([a-z])/u',
            fn (array $m) => $m[1].mb_strtoupper($m[2]),
            trim(preg_replace('/\s+/', ' ', $name) ?? $name),
        );
    }

    private function clean(string $value): string
    {
        return Str::lower(trim($value));
    }

    private function muscleId(string $slug): ?int
    {
        $this->muscleIds ??= Muscle::pluck('id', 'slug')->all();

        return $this->muscleIds[$slug] ?? null;
    }

    private function equipmentId(string $slug): ?int
    {
        $this->equipmentIds ??= Equipment::pluck('id', 'slug')->all();

        return $this->equipmentIds[$slug] ?? null;
    }
}
