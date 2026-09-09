<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RecordType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonalRecord extends Model
{
    protected $fillable = [
        'user_id', 'exercise_id', 'record_type', 'value_primary',
        'value_reps', 'achieved_workout_id', 'achieved_at',
    ];

    protected function casts(): array
    {
        return [
            'record_type' => RecordType::class,
            'value_primary' => 'decimal:2',
            'achieved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    public function workout(): BelongsTo
    {
        return $this->belongsTo(Workout::class, 'achieved_workout_id');
    }
}
