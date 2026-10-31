<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\MediaStorage;
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

    public function avatarUrl(): ?string
    {
        return $this->avatar_path ? MediaStorage::url($this->avatar_path) : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
