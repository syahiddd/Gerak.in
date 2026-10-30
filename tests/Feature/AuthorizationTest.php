<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $user = User::factory()->createOne(['role' => 'user']);

        $this->actingAs($user)->get(route('admin.dashboard'))->assertForbidden();
        $this->actingAs($user)->get(route('admin.users'))->assertForbidden();
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->createOne(['role' => 'admin']);

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
    }

    public function test_user_cannot_delete_another_users_workout(): void
    {
        $owner = User::factory()->createOne();
        $other = User::factory()->createOne();
        $workout = $owner->workouts()->create([
            'name' => 'Mine', 'status' => 'completed',
            'started_at' => now()->subHour(), 'timezone' => 'Asia/Jakarta',
        ]);

        $this->actingAs($other)->delete(route('workouts.destroy', $workout))->assertForbidden();
    }
}
