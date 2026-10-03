<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = [
        'user_id', 'display_name', 'avatar_path', 'bio', 'height_cm', 'is_public',
    ];

    protected function casts(): array
    {
        return ['height_cm' => 'decimal:1', 'is_public' => 'boolean'];
    }

    /** Relative URL so it works whatever APP_URL/host the app is served from. */
    public function avatarUrl(): ?string
    {
        return $this->avatar_path ? '/storage/'.$this->avatar_path : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
