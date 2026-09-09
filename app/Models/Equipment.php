<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipment extends Model
{
    protected $fillable = ['name', 'slug'];

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }
}
