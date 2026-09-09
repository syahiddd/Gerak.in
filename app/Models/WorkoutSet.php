<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SetType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutSet extends Model
{
    protected $fillable = [
        'workout_exercise_id', 'order', 'set_type', 'weight_kg', 'reps',
        'duration_s', 'distance_m', 'rpe', 'bodyweight_kg',
        'is_completed', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'set_type' => SetType::class,
            'weight_kg' => 'decimal:2',
            'rpe' => 'decimal:1',
            'bodyweight_kg' => 'decimal:2',
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function workoutExercise(): BelongsTo
    {
        return $this->belongsTo(WorkoutExercise::class);
    }

    /** Volume contribution in kg (weight-based completed sets only). */
    public function volumeKg(): float
    {
        if (! $this->is_completed || $this->weight_kg === null || $this->reps === null) {
            return 0.0;
        }

        return (float) $this->weight_kg * (int) $this->reps;
    }
}
