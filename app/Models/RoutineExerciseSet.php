<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SetType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoutineExerciseSet extends Model
{
    protected $fillable = [
        'routine_exercise_id', 'order', 'target_reps_min', 'target_reps_max',
        'target_weight_kg', 'target_duration_s', 'target_distance_m', 'set_type', 'target_rpe',
    ];

    protected function casts(): array
    {
        return [
            'set_type' => SetType::class,
            'target_weight_kg' => 'decimal:2',
            'target_rpe' => 'decimal:1',
        ];
    }

    public function routineExercise(): BelongsTo
    {
        return $this->belongsTo(RoutineExercise::class);
    }
}
