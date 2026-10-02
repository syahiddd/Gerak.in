<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class WorkoutPhoto extends Model
{
    protected $fillable = ['workout_id', 'path', 'width', 'height', 'order'];

    protected static function booted(): void
    {
        // The row and the file live and die together.
        static::deleted(fn (WorkoutPhoto $photo) => Storage::disk('public')->delete($photo->path));
    }

    public function workout(): BelongsTo
    {
        return $this->belongsTo(Workout::class);
    }

    /** Relative URL so it works whatever APP_URL/host the app is served from. */
    public function url(): string
    {
        return '/storage/'.$this->path;
    }
}
