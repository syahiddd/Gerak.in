<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ExerciseType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exercise extends Model
{
    use SoftDeletes;

    protected $appends = ['media_credit'];

    protected $fillable = [
        'name', 'slug', 'external_id', 'description', 'overview', 'instructions',
        'exercise_tips', 'variations', 'related_exercise_ids', 'keywords',
        'equipment_id', 'primary_muscle_id', 'secondary_muscle_ids', 'exercise_type',
        'image_path', 'image_url', 'image_urls', 'gif_url', 'video_url',
        'media_source', 'last_synced_at', 'is_system', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'exercise_type' => ExerciseType::class,
            'secondary_muscle_ids' => 'array',
            'image_urls' => 'array',
            'exercise_tips' => 'array',
            'variations' => 'array',
            'related_exercise_ids' => 'array',
            'keywords' => 'array',
            'last_synced_at' => 'datetime',
            'is_system' => 'boolean',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function primaryMuscle(): BelongsTo
    {
        return $this->belongsTo(Muscle::class, 'primary_muscle_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeSystem(Builder $q): Builder
    {
        return $q->where('is_system', true);
    }

    /** Every word must appear somewhere in the name: "pec deck" finds "Lever Pec Deck Fly". */
    public function scopeSearch(Builder $q, string $term): Builder
    {
        foreach (preg_split('/\s+/', trim($term), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $word) {
            $q->where('name', 'like', '%'.addcslashes($word, '%_').'%');
        }

        return $q;
    }

    /** Exercises the user may pick: system ones plus their own custom ones. */
    public function scopeAvailableTo(Builder $q, User $user): Builder
    {
        return $q->where(fn (Builder $w) => $w->where('is_system', true)->orWhere('created_by', $user->id));
    }

    /**
     * Who to credit for the animation. Gym visual media must always carry
     * "© Gym visual" (hasaneyldrm/exercises-dataset terms).
     */
    protected function mediaCredit(): Attribute
    {
        return Attribute::get(fn () => match (true) {
            str_starts_with((string) $this->gif_url, '/storage/exercise-dataset/') => 'gymvisual',
            str_starts_with((string) $this->gif_url, '/storage/exercise-gifs/') => 'workoutx',
            default => null,
        });
    }

    public function isEditableBy(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return ! $this->is_system && (int) $this->created_by === (int) $user->id;
    }
}
