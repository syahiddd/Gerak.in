<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Muscle extends Model
{
    protected $fillable = ['name', 'slug', 'group'];

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class, 'primary_muscle_id');
    }
}
