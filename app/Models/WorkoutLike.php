<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutLike extends Model
{
    protected $fillable = ['workout_id', 'user_id'];

    public function workout(): BelongsTo
    {
        return $this->belongsTo(Workout::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
