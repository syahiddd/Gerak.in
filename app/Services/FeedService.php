<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\Workout;
use App\Models\WorkoutComment;
use BackedEnum;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Turns completed workouts into feed "posts" with one consistent shape for
 * the feed, public profiles and the post detail page. All counts are eager
 * loaded so a page of posts costs a fixed number of queries.
 */
class FeedService
{
    public const PAGE_SIZE = 10;

    private const PREVIEW_EXERCISES = 3;

    private const MEDIA_COLUMNS = 'exercise:id,name,slug,image_path,image_url,image_urls,gif_url,video_url';

    /** Viewer's own posts + posts from people they follow. */
    public function following(User $viewer, ?string $cursor = null): CursorPaginator
    {
        $authors = $viewer->following()->select('users.id');

        return $this->paginate(
            Workout::query()->visibleTo($viewer)->where(fn (Builder $q) => $q
                ->where('workouts.user_id', $viewer->id)
                ->orWhereIn('workouts.user_id', $authors)),
            $viewer,
            $cursor,
        );
    }

    /** Public posts from everyone. */
    public function discover(User $viewer, ?string $cursor = null): CursorPaginator
    {
        return $this->paginate(
            Workout::query()->visibleTo($viewer)->where('workouts.visibility', 'public'),
            $viewer,
            $cursor,
        );
    }

    /** Posts by one author that the viewer may see. */
    public function byAuthor(User $author, User $viewer, ?string $cursor = null): CursorPaginator
    {
        return $this->paginate(
            Workout::query()->visibleTo($viewer)->where('workouts.user_id', $author->id),
            $viewer,
            $cursor,
        );
    }

    /** Full post for the detail page: every exercise and set, plus comments. */
    public function detail(Workout $workout, User $viewer): array
    {
        $workout = $this->withPostRelations(Workout::query()->whereKey($workout->id), $viewer, withSets: true)
            ->with([
                'personalRecords:id,achieved_workout_id,exercise_id,record_type',
                'comments.user:id,name,username',
            ])
            ->firstOrFail();

        $post = $this->present($workout, $viewer, previewOnly: false);

        $prsByExercise = $workout->personalRecords->groupBy('exercise_id');
        $post['exercises'] = $workout->exercises->map(fn ($we) => [
            ...$this->exerciseSummary($we),
            'record_types' => $prsByExercise->get($we->exercise_id)?->pluck('record_type')->map(fn ($t) => $t instanceof BackedEnum ? $t->value : $t)->unique()->values() ?? [],
            'set_list' => $we->sets->map(fn ($s) => [
                'id' => $s->id,
                'set_type' => $s->set_type instanceof BackedEnum ? $s->set_type->value : $s->set_type,
                'weight_kg' => $s->weight_kg,
                'reps' => $s->reps,
                'duration_s' => $s->duration_s,
                'distance_m' => $s->distance_m,
            ])->values(),
        ])->values();

        $post['comments'] = $workout->comments->map(fn (WorkoutComment $c) => $this->presentComment($c, $workout, $viewer))->values();

        return $post;
    }

    public function presentComment(WorkoutComment $c, Workout $workout, User $viewer): array
    {
        return [
            'id' => $c->id,
            'body' => $c->body,
            'created_at' => $c->created_at?->toIso8601String(),
            'user' => $this->presentUser($c->user),
            'can_delete' => $c->user_id === $viewer->id || $workout->user_id === $viewer->id,
        ];
    }

    public function presentUser(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'username' => $user->username];
    }

    private function paginate(Builder $query, User $viewer, ?string $cursor): CursorPaginator
    {
        return $this->withPostRelations($query, $viewer)
            ->orderByDesc('workouts.ended_at')
            ->orderByDesc('workouts.id')
            ->cursorPaginate(self::PAGE_SIZE, ['workouts.*'], 'cursor', $cursor)
            ->through(fn (Workout $w) => $this->present($w, $viewer));
    }

    private function withPostRelations(Builder $query, User $viewer, bool $withSets = false): Builder
    {
        // Sets must be loaded inside this closure: a later with('exercises.sets')
        // would replace it and drop completed_sets_count.
        return $query
            ->with([
                'user:id,name,username',
                'exercises' => fn ($q) => $q
                    ->withCount(['sets as completed_sets_count' => fn ($s) => $s->where('is_completed', true)])
                    ->when($withSets, fn ($q) => $q->with(['sets' => fn ($s) => $s->where('is_completed', true)->orderBy('order')])),
                'exercises.'.self::MEDIA_COLUMNS,
            ])
            ->withCount(['likes', 'comments', 'personalRecords'])
            ->withExists(['likes as liked_by_me' => fn ($q) => $q->where('user_id', $viewer->id)]);
    }

    private function present(Workout $w, User $viewer, bool $previewOnly = true): array
    {
        $exercises = $w->exercises;

        return [
            'id' => $w->id,
            'title' => $w->name,
            'description' => $w->description,
            'visibility' => $w->visibility->value,
            'ended_at' => $w->ended_at?->toIso8601String(),
            'duration_seconds' => $w->duration_seconds,
            'volume_kg' => $w->total_volume_kg !== null ? (float) $w->total_volume_kg : null,
            'sets_count' => (int) $exercises->sum('completed_sets_count'),
            'records_count' => (int) $w->personal_records_count,
            'likes_count' => (int) $w->likes_count,
            'comments_count' => (int) $w->comments_count,
            'liked_by_me' => (bool) $w->liked_by_me,
            'is_owner' => $w->user_id === $viewer->id,
            'user' => $this->presentUser($w->user),
            'exercises_total' => $exercises->count(),
            'exercises' => ($previewOnly ? $exercises->take(self::PREVIEW_EXERCISES) : $exercises)
                ->map(fn ($we) => $this->exerciseSummary($we))->values(),
        ];
    }

    private function exerciseSummary($we): array
    {
        $ex = $we->exercise;

        return [
            'id' => $we->id,
            'sets' => (int) $we->completed_sets_count,
            'exercise' => $ex ? $ex->only(['id', 'name', 'slug', 'image_path', 'image_url', 'image_urls', 'gif_url', 'video_url']) : null,
        ];
    }
}
