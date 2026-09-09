<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoutineExercise extends Model
{
    protected $fillable = [
        'routine_id', 'exercise_id', 'order', 'notes', 'rest_seconds', 'superset_group',
    ];

    protected function casts(): array
    {
        return ['order' => 'integer', 'rest_seconds' => 'integer'];
    }

    public function routine(): BelongsTo
    {
        return $this->belongsTo(Routine::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    public function targetSets(): HasMany
    {
        return $this->hasMany(RoutineExerciseSet::class)->orderBy('order');
    }
}
