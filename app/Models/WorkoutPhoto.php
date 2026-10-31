<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\MediaStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutPhoto extends Model
{
    protected $fillable = ['workout_id', 'path', 'width', 'height', 'order'];

    protected static function booted(): void
    {
        // The row and the file live and die together.
        static::deleted(fn (WorkoutPhoto $photo) => MediaStorage::delete($photo->path));
    }

    public function workout(): BelongsTo
    {
        return $this->belongsTo(Workout::class);
    }

    public function url(): string
    {
        return MediaStorage::url($this->path);
    }
}
