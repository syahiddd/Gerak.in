<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ErrorPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_unknown_url_renders_the_themed_404_page(): void
    {
        $this->get('/this-page-does-not-exist')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page->component('Error')->where('status', 404));
    }

    public function test_forbidden_page_keeps_its_status_and_uses_the_themed_page(): void
    {
        $this->actingAs(User::factory()->createOne())->get('/admin')
            ->assertForbidden()
            ->assertInertia(fn (Assert $page) => $page->component('Error')->where('status', 403));
    }

    public function test_json_requests_still_get_json_errors(): void
    {
        $this->getJson('/this-page-does-not-exist')->assertNotFound()->assertJsonStructure(['message']);
    }

    public function test_server_errors_keep_the_debug_page_while_debugging(): void
    {
        config(['app.debug' => true]);
        $this->app['router']->get('/boom', fn () => throw new \RuntimeException('boom'));

        $this->get('/boom')->assertStatus(500)->assertDontSee('"component":"Error"', false);

        config(['app.debug' => false]);
        $this->get('/boom')->assertStatus(500)
            ->assertInertia(fn (Assert $page) => $page->component('Error')->where('status', 500));
    }
}
