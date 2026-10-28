<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ExerciseType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class Exercise extends Model
{
    use SoftDeletes;

    protected $appends = ['media_credit'];

    protected $fillable = [
        'name', 'slug', 'external_id', 'description', 'overview', 'instructions',
        'exercise_tips', 'variations', 'related_exercise_ids', 'keywords',
        'equipment_id', 'primary_muscle_id', 'secondary_muscle_ids', 'exercise_type',
        'image_path', 'image_url', 'image_urls', 'gif_url', 'video_url',
        'media_source', 'last_synced_at', 'is_system', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'exercise_type' => ExerciseType::class,
            'secondary_muscle_ids' => 'array',
            'image_urls' => 'array',
            'exercise_tips' => 'array',
            'variations' => 'array',
            'related_exercise_ids' => 'array',
            'keywords' => 'array',
            'last_synced_at' => 'datetime',
            'is_system' => 'boolean',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function primaryMuscle(): BelongsTo
    {
        return $this->belongsTo(Muscle::class, 'primary_muscle_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeSystem(Builder $q): Builder
    {
        return $q->where('is_system', true);
    }

    /** Every word must appear somewhere in the name: "pec deck" finds "Lever Pec Deck Fly". */
    public function scopeSearch(Builder $q, string $term): Builder
    {
        foreach (preg_split('/\s+/', trim($term), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $word) {
            $q->where('name', 'like', '%'.addcslashes($word, '%_').'%');
        }

        return $q;
    }

    /** Exercises the user may pick: system ones plus their own custom ones. */
    public function scopeAvailableTo(Builder $q, User $user): Builder
    {
        return $q->where(fn (Builder $w) => $w->where('is_system', true)->orWhere('created_by', $user->id));
    }

    /**
     * Resolve a dataset storage path to a remote URL if the file is not on local disk.
     */
    private function resolveDatasetMediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, '/storage/exercise-dataset/')) {
            $diskPath = Str::after($path, '/storage/');
            if (! self::existsOnPublicDisk($diskPath)) {
                $rel = Str::after($path, '/storage/exercise-dataset/');
                $base = rtrim((string) config('services.exercise_dataset.base_url', 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main'), '/');

                return $base.'/'.$rel;
            }
        }

        return $path;
    }

    /** Set once the public disk proved unusable, so we don't retry it for every attribute read. */
    private static bool $publicDiskUnavailable = false;

    /**
     * On read-only deploys (Vercel) storage/app/public is not shipped and the local
     * driver throws while creating its root, so treat the file as missing instead.
     */
    private static function existsOnPublicDisk(string $diskPath): bool
    {
        if (self::$publicDiskUnavailable) {
            return false;
        }

        try {
            return Storage::disk('public')->exists($diskPath);
        } catch (Throwable) {
            self::$publicDiskUnavailable = true;

            return false;
        }
    }

    protected function gifUrl(): Attribute
    {
        return Attribute::get(fn (?string $value) => $this->resolveDatasetMediaUrl($value));
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn (?string $value) => $this->resolveDatasetMediaUrl($value));
    }

    /**
     * Who to credit for the animation. Gym visual media must always carry
     * "© Gym visual" (hasaneyldrm/exercises-dataset terms).
     */
    protected function mediaCredit(): Attribute
    {
        return Attribute::get(fn () => match (true) {
            $this->media_source === 'gymvisual' => 'gymvisual',
            str_starts_with((string) $this->gif_url, '/storage/exercise-dataset/') => 'gymvisual',
            str_contains((string) $this->gif_url, 'exercises-dataset') => 'gymvisual',
            str_starts_with((string) $this->gif_url, '/storage/exercise-gifs/') => 'workoutx',
            default => null,
        });
    }

    public function isEditableBy(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return ! $this->is_system && (int) $this->created_by === (int) $user->id;
    }
}
