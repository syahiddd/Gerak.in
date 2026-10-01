<?php

declare(strict_types=1);

namespace Tests\Feature\Social;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileUsernameTest extends TestCase
{
    use RefreshDatabase;

    public function test_usernames_are_generated_unique(): void
    {
        $a = User::factory()->create(['name' => 'Syahid Amanullah']);
        $b = User::factory()->create(['name' => 'Syahid Amanullah']);

        $this->assertSame('syahid_amanullah', $a->username);
        $this->assertSame('syahid_amanullah2', $b->username);
    }

    public function test_registration_assigns_username(): void
    {
        $this->post('/register', [
            'name' => 'Rina P.',
            'email' => 'rina@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertMatchesRegularExpression('/^[a-z0-9_.]{3,30}$/', User::where('email', 'rina@example.test')->value('username'));
    }

    public function test_username_and_bio_can_be_updated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patch('/profile', [
            'name' => $user->name,
            'email' => $user->email,
            'username' => 'iron.rina',
            'bio' => 'Squats daily.',
        ])->assertSessionHasNoErrors();

        $this->assertSame('iron.rina', $user->fresh()->username);
        $this->assertSame('Squats daily.', $user->fresh()->profile->bio);
        $this->actingAs($user)->get('/u/iron.rina')->assertOk();
    }

    public function test_username_must_be_valid_and_unique(): void
    {
        $taken = User::factory()->create();
        $user = User::factory()->create();

        foreach (['Bad Name', 'ab', 'UPPER', $taken->username] as $bad) {
            $this->actingAs($user)->patch('/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'username' => $bad,
            ])->assertSessionHasErrors('username');
        }
    }
}
