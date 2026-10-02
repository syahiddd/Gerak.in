<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Support\UsernameGenerator;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected static function booted(): void
    {
        // Everyone gets a unique @username; they can change it on the profile page.
        static::creating(function (User $user): void {
            if (! $user->username) {
                $user->username = UsernameGenerator::generate((string) $user->name);
            }
        });

        // Every account owns exactly one profile + settings row.
        static::created(function (User $user): void {
            $user->profile()->firstOrCreate([]);
            $user->settings()->firstOrCreate([]);
        });
    }

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'timezone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_suspended' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function routines(): HasMany
    {
        return $this->hasMany(Routine::class);
    }

    public function routineFolders(): HasMany
    {
        return $this->hasMany(RoutineFolder::class);
    }

    public function workouts(): HasMany
    {
        return $this->hasMany(Workout::class);
    }

    public function personalRecords(): HasMany
    {
        return $this->hasMany(PersonalRecord::class);
    }

    public function bodyMeasurements(): HasMany
    {
        return $this->hasMany(BodyMeasurement::class);
    }

    public function customExercises(): HasMany
    {
        return $this->hasMany(Exercise::class, 'created_by');
    }

    /** Users this user follows. */
    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')->withTimestamps();
    }

    /** Users following this user. */
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')->withTimestamps();
    }

    public function isFollowing(User $other): bool
    {
        return $this->following()->whereKey($other->id)->exists();
    }
}
