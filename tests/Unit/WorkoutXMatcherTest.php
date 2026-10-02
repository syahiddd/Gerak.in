<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\WorkoutXMatcher;
use PHPUnit\Framework\TestCase;

class WorkoutXMatcherTest extends TestCase
{
    private function c(string $name): array
    {
        return ['id' => '1', 'name' => $name, 'gifUrl' => 'https://api.workoutxapp.com/v1/gifs/1.gif'];
    }

    public function test_exact_normalized_match_wins(): void
    {
        $hit = WorkoutXMatcher::best('Pull-Up', [$this->c('Pull Up (neutral Grip)'), $this->c('Pull-up')]);
        $this->assertSame('Pull-up', $hit['name']);
    }

    public function test_parenthetical_qualifier_is_ignored(): void
    {
        $hit = WorkoutXMatcher::best('Front Squat', [$this->c('Barbell Front Squat Clean'), $this->c('Front Squat (bodyweight)')]);
        $this->assertSame('Front Squat (bodyweight)', $hit['name']);
    }

    public function test_contains_all_words_prefers_fewest_extras(): void
    {
        $hit = WorkoutXMatcher::best('Deadlift', [$this->c('Barbell Sumo Deadlift Stiff Leg'), $this->c('Barbell Deadlift')]);
        $this->assertSame('Barbell Deadlift', $hit['name']);
    }

    public function test_returns_null_when_nothing_close(): void
    {
        $this->assertNull(WorkoutXMatcher::best('Plank', [$this->c('Barbell Deadlift')]));
        $this->assertNull(WorkoutXMatcher::best('Plank', [['name' => 'Plank']])); // no gifUrl
    }

    public function test_fallback_term_drops_equipment_prefix(): void
    {
        $this->assertSame('curl', WorkoutXMatcher::fallbackTerm('Barbell Curl'));
        $this->assertSame('bent over row', WorkoutXMatcher::fallbackTerm('One-Arm Dumbbell Row'));
        $this->assertNull(WorkoutXMatcher::fallbackTerm('Plank'));
    }

    public function test_alias_sets_search_term_and_target(): void
    {
        $this->assertSame('chin-up', WorkoutXMatcher::searchTerm('Chin-Up'));
        $this->assertSame('barbell full squat', WorkoutXMatcher::searchTerm('Back Squat'));
        $hit = WorkoutXMatcher::best('Back Squat', [$this->c('Barbell Full Squat (side Pov)'), $this->c('Barbell Full Squat')]);
        $this->assertSame('Barbell Full Squat', $hit['name']);
    }

    public function test_variant_words_are_penalised(): void
    {
        $hit = WorkoutXMatcher::best('Hip Thrust', [$this->c('Resistance Band Hip Thrusts On Knees (female)'), $this->c('Barbell Hip Thrust')]);
        $this->assertSame('Barbell Hip Thrust', $hit['name']);
    }
}
