<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(): array
    {
        return [
            'unit_system' => 'imperial',
            'theme' => 'dark',
            'default_rest_seconds' => 120,
            'default_sets' => 4,
            'week_starts_on' => 'sun',
            'timezone' => 'America/New_York',
        ];
    }

    public function test_guest_cannot_access_settings(): void
    {
        $this->get(route('settings.edit'))->assertRedirect(route('login'));
        $this->patch(route('settings.update'), $this->validPayload())->assertRedirect(route('login'));
    }

    public function test_new_users_get_profile_and_settings_rows(): void
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->profile()->first());
        $this->assertNotNull($user->settings()->first());
        $this->assertEquals('metric', $user->settings()->first()->unit_system->value);
    }

    public function test_settings_page_renders_with_current_values(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('settings.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Settings')
                ->has('settings'));
    }

    public function test_user_can_update_settings_and_timezone(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patch(route('settings.update'), $this->validPayload())
            ->assertRedirect()
            ->assertSessionHas('success');

        $user->refresh();
        $settings = $user->settings()->first();

        $this->assertEquals('imperial', $settings->unit_system->value);
        $this->assertEquals('dark', $settings->theme);
        $this->assertEquals(120, $settings->default_rest_seconds);
        $this->assertEquals(4, $settings->default_sets);
        $this->assertEquals('sun', $settings->week_starts_on);
        $this->assertEquals('America/New_York', $user->timezone);
    }

    public function test_settings_validation_rejects_bad_values(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch(route('settings.update'), [
            ...$this->validPayload(),
            'unit_system' => 'stones',
            'theme' => 'neon',
            'default_rest_seconds' => -5,
            'default_sets' => 99,
            'week_starts_on' => 'fri',
            'timezone' => str_repeat('x', 100),
        ]);

        $response->assertSessionHasErrors([
            'unit_system', 'theme', 'default_rest_seconds',
            'default_sets', 'week_starts_on', 'timezone',
        ]);
    }

    public function test_update_creates_settings_row_when_missing(): void
    {
        $user = User::factory()->create();
        $user->settings()->delete();

        $this->actingAs($user)->patch(route('settings.update'), $this->validPayload())
            ->assertRedirect();

        $this->assertNotNull($user->settings()->first());
    }
}
