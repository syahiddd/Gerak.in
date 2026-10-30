<?php

declare(strict_types=1);

namespace Tests\Feature\Social;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VisibilityTest extends TestCase
{
    use CreatesPosts, RefreshDatabase;

    public function test_public_post_is_visible_to_everyone(): void
    {
        $owner = User::factory()->createOne();
        $stranger = User::factory()->createOne();
        $post = $this->makePost($owner, 'public');

        $this->actingAs($stranger)->get(route('posts.show', $post))->assertOk();
        $this->assertContains($post->id, $this->feedIds($stranger, 'discover'));
        $this->assertNotContains($post->id, $this->feedIds($stranger, 'following'));
    }

    public function test_followers_post_is_visible_only_to_followers(): void
    {
        $owner = User::factory()->createOne();
        $follower = User::factory()->createOne();
        $stranger = User::factory()->createOne();
        $follower->following()->attach($owner->id);
        $post = $this->makePost($owner, 'followers');

        $this->actingAs($follower)->get(route('posts.show', $post))->assertOk();
        $this->assertContains($post->id, $this->feedIds($follower));
        $this->assertNotContains($post->id, $this->feedIds($follower, 'discover'));

        $this->actingAs($stranger)->get(route('posts.show', $post))->assertForbidden();
    }

    public function test_private_post_is_visible_only_to_owner(): void
    {
        $owner = User::factory()->createOne();
        $follower = User::factory()->createOne();
        $follower->following()->attach($owner->id);
        $post = $this->makePost($owner, 'private');

        $this->actingAs($owner)->get(route('posts.show', $post))->assertOk();
        $this->assertContains($post->id, $this->feedIds($owner));
        $this->actingAs($follower)->get(route('posts.show', $post))->assertForbidden();
        $this->assertNotContains($post->id, $this->feedIds($follower));
    }

    public function test_in_progress_workouts_never_appear(): void
    {
        $owner = User::factory()->createOne();
        $post = $this->makePost($owner, 'public', 'in_progress');

        $this->assertNotContains($post->id, $this->feedIds($owner));
        $this->actingAs($owner)->get(route('posts.show', $post))->assertForbidden();
    }

    public function test_suspended_authors_are_hidden(): void
    {
        $owner = User::factory()->createOne();
        $viewer = User::factory()->createOne();
        $post = $this->makePost($owner, 'public');
        $owner->forceFill(['is_suspended' => true])->save();

        $this->assertNotContains($post->id, $this->feedIds($viewer, 'discover'));
        $this->actingAs($viewer)->get(route('users.show', $owner->username))->assertNotFound();
    }

    public function test_profile_lists_only_posts_viewer_may_see(): void
    {
        $owner = User::factory()->createOne();
        $viewer = User::factory()->createOne();
        $public = $this->makePost($owner, 'public');
        $this->makePost($owner, 'followers');
        $this->makePost($owner, 'private');

        $this->actingAs($viewer)->get(route('users.show', $owner->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Social/Profile')
                ->where('profile.workouts_count', 1)
                ->has('posts.data', 1)
                ->where('posts.data.0.id', $public->id));
    }

    public function test_last_trained_date_ignores_workouts_the_viewer_cannot_see(): void
    {
        $owner = User::factory()->createOne();
        $viewer = User::factory()->createOne();
        $this->makePost($owner, 'public')->update(['ended_at' => now()->subDays(3)]);
        $this->makePost($owner, 'private')->update(['ended_at' => now()]);

        $this->actingAs($viewer)->get(route('users.show', $owner->username))
            ->assertInertia(fn ($page) => $page->where(
                'profile.last_workout_at',
                fn ($at) => abs(now()->subDays(3)->diffInMinutes($at)) < 5,
            ));

        $this->actingAs($owner)->get(route('users.show', $owner->username))
            ->assertInertia(fn ($page) => $page->where(
                'profile.last_workout_at',
                fn ($at) => abs(now()->diffInMinutes($at)) < 5,
            ));
    }
}
