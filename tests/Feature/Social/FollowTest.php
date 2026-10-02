<?php

declare(strict_types=1);

namespace Tests\Feature\Social;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowTest extends TestCase
{
    use CreatesPosts, RefreshDatabase;

    public function test_follow_and_unfollow(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($me)->post(route('users.follow', $other->username))->assertRedirect();
        $this->actingAs($me)->post(route('users.follow', $other->username))->assertRedirect();
        $this->assertDatabaseCount('follows', 1);
        $this->assertTrue($me->isFollowing($other));

        $this->actingAs($me)->delete(route('users.unfollow', $other->username))->assertRedirect();
        $this->assertDatabaseCount('follows', 0);
    }

    public function test_cannot_follow_yourself(): void
    {
        $me = User::factory()->create();

        $this->actingAs($me)->post(route('users.follow', $me->username))->assertSessionHasErrors('follow');
        $this->assertDatabaseCount('follows', 0);
    }

    public function test_following_feed_includes_followed_users_posts(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $post = $this->makePost($other, 'public');

        $this->assertNotContains($post->id, $this->feedIds($me));

        $this->actingAs($me)->post(route('users.follow', $other->username));
        $this->assertContains($post->id, $this->feedIds($me));
    }

    public function test_follower_lists_and_search(): void
    {
        $me = User::factory()->create(['name' => 'Searcher']);
        $other = User::factory()->create(['name' => 'Rina Pratama']);
        $other->following()->attach($me->id);

        $this->actingAs($me)->get(route('users.followers', $me->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('people.data', 1)->where('people.data.0.username', $other->username));

        $this->actingAs($me)->get(route('users.search', ['q' => 'rina']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('people', 1)->where('people.0.is_following', false));
    }
}
