<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RoutineStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Routine extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'folder_id', 'name', 'description', 'notes', 'status',
    ];

    protected function casts(): array
    {
        return ['status' => RoutineStatus::class];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(RoutineFolder::class, 'folder_id');
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(RoutineExercise::class)->orderBy('order');
    }

    public function isArchived(): bool
    {
        return $this->status === RoutineStatus::Archived;
    }
}
