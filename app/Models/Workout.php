<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\WorkoutStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workout extends Model
{
    protected $fillable = [
        'user_id', 'routine_id', 'name', 'notes', 'status',
        'started_at', 'paused_seconds_total', 'ended_at',
        'duration_seconds', 'total_volume_kg', 'timezone',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkoutStatus::class,
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'total_volume_kg' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function routine(): BelongsTo
    {
        return $this->belongsTo(Routine::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(WorkoutExercise::class)->orderBy('order');
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->whereIn('status', [WorkoutStatus::InProgress, WorkoutStatus::Paused]);
    }

    public function scopeCompleted(Builder $q): Builder
    {
        return $q->where('status', WorkoutStatus::Completed);
    }

    public function isActive(): bool
    {
        return in_array($this->status, [WorkoutStatus::InProgress, WorkoutStatus::Paused], true);
    }
}
