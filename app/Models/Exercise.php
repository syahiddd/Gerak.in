<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ExerciseType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exercise extends Model
{
    use SoftDeletes;

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

    public function scopeSearch(Builder $q, string $term): Builder
    {
        return $q->where('name', 'like', '%'.$term.'%');
    }

    public function isEditableBy(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return ! $this->is_system && (int) $this->created_by === (int) $user->id;
    }
}
