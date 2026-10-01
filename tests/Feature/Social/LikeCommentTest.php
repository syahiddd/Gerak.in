<?php

declare(strict_types=1);

namespace Tests\Feature\Social;

use App\Models\User;
use App\Models\WorkoutComment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LikeCommentTest extends TestCase
{
    use CreatesPosts, RefreshDatabase;

    public function test_like_is_idempotent_and_can_be_removed(): void
    {
        $owner = User::factory()->create();
        $fan = User::factory()->create();
        $post = $this->makePost($owner, 'public');

        $this->actingAs($fan)->post(route('posts.like', $post))->assertRedirect();
        $this->actingAs($fan)->post(route('posts.like', $post))->assertRedirect();
        $this->assertDatabaseCount('workout_likes', 1);

        $this->actingAs($fan)->delete(route('posts.unlike', $post))->assertRedirect();
        $this->assertDatabaseCount('workout_likes', 0);
    }

    public function test_cannot_like_or_comment_on_hidden_post(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $post = $this->makePost($owner, 'private');

        $this->actingAs($stranger)->post(route('posts.like', $post))->assertForbidden();
        $this->actingAs($stranger)->post(route('posts.comments.store', $post), ['body' => 'hi'])->assertForbidden();
        $this->assertDatabaseCount('workout_likes', 0);
        $this->assertDatabaseCount('workout_comments', 0);
    }

    public function test_comment_validation(): void
    {
        $owner = User::factory()->create();
        $post = $this->makePost($owner, 'public');

        $this->actingAs($owner)->post(route('posts.comments.store', $post), ['body' => ''])->assertSessionHasErrors('body');
        $this->actingAs($owner)->post(route('posts.comments.store', $post), ['body' => str_repeat('a', 1001)])->assertSessionHasErrors('body');
        $this->actingAs($owner)->post(route('posts.comments.store', $post), ['body' => '  Great work  '])->assertRedirect();
        $this->assertDatabaseHas('workout_comments', ['workout_id' => $post->id, 'body' => 'Great work']);
    }

    public function test_comment_delete_rules(): void
    {
        $owner = User::factory()->create();
        $author = User::factory()->create();
        $other = User::factory()->create();
        $post = $this->makePost($owner, 'public');

        $c1 = WorkoutComment::create(['workout_id' => $post->id, 'user_id' => $author->id, 'body' => 'one']);
        $c2 = WorkoutComment::create(['workout_id' => $post->id, 'user_id' => $author->id, 'body' => 'two']);

        $this->actingAs($other)->delete(route('posts.comments.destroy', $c1))->assertForbidden();
        $this->actingAs($author)->delete(route('posts.comments.destroy', $c1))->assertRedirect();
        $this->actingAs($owner)->delete(route('posts.comments.destroy', $c2))->assertRedirect();
        $this->assertDatabaseCount('workout_comments', 0);
    }

    public function test_post_detail_includes_comments_and_like_state(): void
    {
        $owner = User::factory()->create();
        $fan = User::factory()->create();
        $post = $this->makePost($owner, 'public');
        $post->likes()->create(['user_id' => $fan->id]);
        WorkoutComment::create(['workout_id' => $post->id, 'user_id' => $fan->id, 'body' => 'Nice']);

        $this->actingAs($fan)->get(route('posts.show', $post))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Social/Post')
                ->where('post.liked_by_me', true)
                ->where('post.likes_count', 1)
                ->where('post.comments.0.body', 'Nice')
                ->where('post.comments.0.can_delete', true)
                ->where('post.sets_count', 1)
                ->where('post.exercises.0.sets', 1)
                ->where('post.exercises.0.set_list.0.reps', 5));
    }
}
