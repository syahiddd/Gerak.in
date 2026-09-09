<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\MeasurementType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BodyMeasurement extends Model
{
    protected $fillable = ['user_id', 'type', 'value', 'recorded_at', 'notes'];

    protected function casts(): array
    {
        return [
            'type' => MeasurementType::class,
            'value' => 'decimal:2',
            'recorded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
