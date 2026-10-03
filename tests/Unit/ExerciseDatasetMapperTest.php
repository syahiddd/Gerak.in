<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\ExerciseType;
use App\Services\ExerciseDatasetMapper;
use PHPUnit\Framework\TestCase;

class ExerciseDatasetMapperTest extends TestCase
{
    public function test_title_case_handles_hyphens_slashes_and_brackets(): void
    {
        $this->assertSame('Barbell Bench Press', ExerciseDatasetMapper::titleCase('barbell bench press'));
        $this->assertSame('3/4 Sit-Up', ExerciseDatasetMapper::titleCase('3/4 sit-up'));
        $this->assertSame('Push-Up (On Stability Ball)', ExerciseDatasetMapper::titleCase('push-up  (on stability ball)'));
    }

    public function test_exercise_type_follows_body_part_and_equipment(): void
    {
        $this->assertSame(ExerciseType::Duration, ExerciseDatasetMapper::resolveType('cardio', 'body weight'));
        $this->assertSame(ExerciseType::AssistedBodyweight, ExerciseDatasetMapper::resolveType('back', 'assisted'));
        $this->assertSame(ExerciseType::WeightedBodyweight, ExerciseDatasetMapper::resolveType('chest', 'weighted'));
        $this->assertSame(ExerciseType::BodyweightReps, ExerciseDatasetMapper::resolveType('waist', 'body weight'));
        $this->assertSame(ExerciseType::WeightReps, ExerciseDatasetMapper::resolveType('chest', 'barbell'));
    }
}
