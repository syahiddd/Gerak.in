<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\UnitSystem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = [
        'user_id', 'unit_system', 'theme', 'default_rest_seconds',
        'default_sets', 'week_starts_on', 'notifications',
    ];

    protected function casts(): array
    {
        return [
            'unit_system' => UnitSystem::class,
            'default_rest_seconds' => 'integer',
            'default_sets' => 'integer',
            'notifications' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isMetric(): bool
    {
        return $this->unit_system === UnitSystem::Metric;
    }
}
