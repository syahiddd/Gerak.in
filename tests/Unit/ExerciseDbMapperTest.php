<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\ExerciseType;
use App\Models\Equipment;
use App\Models\Muscle;
use App\Services\ExerciseDbMapper;
use Database\Seeders\ReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExerciseDbMapperTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ReferenceSeeder::class);
    }

    public function test_maps_strength_payload_to_local_schema(): void
    {
        $mapped = ExerciseDbMapper::map($this->benchPressPayload());

        $this->assertSame('Lever Pec Deck Fly', $mapped['name']);
        $this->assertSame('exr_41n2hZZdH9uyYFGZ', $mapped['external_id']);
        $this->assertSame(ExerciseType::WeightReps->value, $mapped['exercise_type']);
        $this->assertSame('Lever-Pec-Deck-Fly-Chest.mp4', $mapped['video_url']);
        $this->assertSame('Lever-Pec-Deck-Fly-Chest.png', $mapped['image_url']);
        $this->assertTrue(is_array($mapped['exercise_tips']) && count($mapped['exercise_tips']) === 1);
        $this->assertTrue(is_array($mapped['variations']) && count($mapped['variations']) === 1);
        $this->assertSame('exercisedb', $mapped['media_source']);
        $this->assertTrue($mapped['is_system']);
        // Chest synonyms resolve to the local chest muscle; leverage machine has no local match.
        $this->assertNotNull($mapped['primary_muscle_id']);
        $this->assertSame('chest', Muscle::find($mapped['primary_muscle_id'])->slug);
    }

    public function test_maps_cardio_to_distance_duration(): void
    {
        $mapped = ExerciseDbMapper::map([
            'exerciseId' => 'exr_cardio1',
            'name' => 'Treadmill Run',
            'exerciseType' => 'CARDIO',
            'equipments' => ['TREADMILL'],
            'bodyParts' => ['LEGS'],
            'targetMuscles' => ['Quadriceps'],
        ]);

        $this->assertSame(ExerciseType::DistanceDuration->value, $mapped['exercise_type']);
        $this->assertSame('quadriceps', Muscle::find($mapped['primary_muscle_id'])->slug);
        $this->assertSame('treadmill', Equipment::find($mapped['equipment_id'])->slug);
    }

    public function test_maps_bodyweight_equipment(): void
    {
        $mapped = ExerciseDbMapper::map([
            'exerciseId' => 'exr_bw1',
            'name' => 'Push-Up',
            'exerciseType' => 'STRENGTH',
            'equipments' => ['BODY WEIGHT'],
            'bodyParts' => ['CHEST'],
            'targetMuscles' => ['Pectoralis Major'],
        ]);

        $this->assertSame(ExerciseType::BodyweightReps->value, $mapped['exercise_type']);
        $this->assertSame('bodyweight', Equipment::find($mapped['equipment_id'])->slug);
    }

    public function test_slug_contains_external_suffix(): void
    {
        $mapped = ExerciseDbMapper::map($this->benchPressPayload());

        $this->assertStringStartsWith('lever-pec-deck-fly', $mapped['slug']);
        $this->assertStringEndsWith('uyyfgz', $mapped['slug']);
    }

    /** @return array<string,mixed> */
    private function benchPressPayload(): array
    {
        return [
            'exerciseId' => 'exr_41n2hZZdH9uyYFGZ',
            'name' => 'Lever Pec Deck Fly',
            'imageUrl' => 'Lever-Pec-Deck-Fly-Chest.png',
            'equipments' => ['LEVERAGE MACHINE'],
            'bodyParts' => ['CHEST'],
            'exerciseType' => 'STRENGTH',
            'targetMuscles' => ['Pectoralis Major Clavicular Head'],
            'secondaryMuscles' => ['Deltoid Anterior'],
            'videoUrl' => 'Lever-Pec-Deck-Fly-Chest.mp4',
            'keywords' => ['Chest fly'],
            'overview' => 'A chest exercise.',
            'instructions' => ['Sit down.', 'Push together.'],
            'exerciseTips' => ['Keep it controlled.'],
            'variations' => ['Cable Crossover: constant tension.'],
            'relatedExerciseIds' => ['exr_abc'],
        ];
    }
}
