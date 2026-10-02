<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\WorkoutStatus;
use App\Enums\WorkoutVisibility;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workout extends Model
{
    protected $fillable = [
        'user_id', 'routine_id', 'name', 'notes', 'description', 'status', 'visibility',
        'started_at', 'paused_seconds_total', 'paused_at', 'ended_at',
        'duration_seconds', 'total_volume_kg', 'timezone',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkoutStatus::class,
            'visibility' => WorkoutVisibility::class,
            'started_at' => 'datetime',
            'paused_at' => 'datetime',
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

    protected static function booted(): void
    {
        // DB cascades remove photo rows but not files; delete through the model.
        static::deleting(fn (Workout $w) => $w->photos()->get()->each->delete());
    }

    public function photos(): HasMany
    {
        return $this->hasMany(WorkoutPhoto::class)->orderBy('order');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(WorkoutLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(WorkoutComment::class)->oldest();
    }

    public function personalRecords(): HasMany
    {
        return $this->hasMany(PersonalRecord::class, 'achieved_workout_id');
    }

    /**
     * Completed workouts $viewer may see as posts: their own, public ones, and
     * follower-only ones from people they follow. Suspended authors are hidden.
     */
    public function scopeVisibleTo(Builder $q, User $viewer): Builder
    {
        return $q->where('workouts.status', WorkoutStatus::Completed)
            ->whereHas('user', fn (Builder $u) => $u->where('is_suspended', false))
            ->where(function (Builder $w) use ($viewer) {
                $w->where('workouts.user_id', $viewer->id)
                    ->orWhere('workouts.visibility', WorkoutVisibility::Public)
                    ->orWhere(function (Builder $f) use ($viewer) {
                        $f->where('workouts.visibility', WorkoutVisibility::Followers)
                            ->whereIn('workouts.user_id', $viewer->following()->select('users.id'));
                    });
            });
    }

    public function isVisibleTo(User $viewer): bool
    {
        return static::query()->whereKey($this->id)->visibleTo($viewer)->exists();
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

    public function isPaused(): bool
    {
        return $this->status === WorkoutStatus::Paused;
    }

    /** Live elapsed seconds excluding all paused time (including an ongoing pause). */
    public function elapsedSeconds(): int
    {
        $end = ($this->ended_at ?? now())->getTimestamp();
        $paused = (int) $this->paused_seconds_total;
        if ($this->paused_at !== null && $this->ended_at === null) {
            $paused += $end - $this->paused_at->getTimestamp();
        }

        return max(0, $end - $this->started_at->getTimestamp() - $paused);
    }
}
