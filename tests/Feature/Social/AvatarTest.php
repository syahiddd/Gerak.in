<?php

declare(strict_types=1);

namespace Tests\Feature\Social;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AvatarTest extends TestCase
{
    use CreatesPosts, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    /** 1x1 lossless WebP in a VP8X container with an EXIF chunk carrying a fake GPS marker. */
    public static function webpWithExif(): string
    {
        $plain = base64_decode('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');
        $vp8x = 'VP8X'.pack('V', 10).chr(0x08)."\0\0\0\0\0\0\0\0\0";
        $exifData = "Exif\0\0GPS-LAT-6.2088";
        $exif = 'EXIF'.pack('V', strlen($exifData)).$exifData.(strlen($exifData) % 2 ? "\0" : '');
        $body = $vp8x.substr($plain, 12).$exif;

        return 'RIFF'.pack('V', 4 + strlen($body)).'WEBP'.$body;
    }

    private function webpUpload(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'webp');
        file_put_contents($path, self::webpWithExif());

        return new UploadedFile($path, 'avatar.webp', 'image/webp', null, true);
    }

    public function test_upload_stores_webp_without_metadata_and_shows_everywhere(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => $this->webpUpload()])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $path = $user->fresh()->profile->avatar_path;
        $this->assertStringEndsWith('.webp', $path);
        $stored = Storage::disk('public')->get($path);
        $this->assertSame('image/webp', getimagesizefromstring($stored)['mime']);
        $this->assertStringNotContainsString('GPS-LAT', $stored);

        $url = '/storage/'.$path;
        $post = $this->makePost($user, 'public');
        $viewer = User::factory()->create();

        $this->actingAs($viewer)->get(route('users.show', $user->username))
            ->assertInertia(fn ($page) => $page
                ->where('profile.avatar_url', $url)
                ->where('posts.data.0.user.avatar_url', $url));

        $this->actingAs($user)->get(route('posts.show', $post))
            ->assertInertia(fn ($page) => $page->where('auth.user.avatar_url', $url));
    }

    public function test_png_fallback_is_accepted(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('me.png', 800, 600)])
            ->assertSessionHasNoErrors();

        $path = $user->fresh()->profile->avatar_path;
        Storage::disk('public')->assertExists($path);
        // WebP when the server's GD can encode it, otherwise a clean PNG.
        $this->assertContains(getimagesizefromstring(Storage::disk('public')->get($path))['mime'], ['image/webp', 'image/png']);
    }

    public function test_replacing_and_removing_delete_old_files(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => $this->webpUpload()]);
        $first = $user->fresh()->profile->avatar_path;

        $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => $this->webpUpload()]);
        $second = $user->fresh()->profile->avatar_path;

        $this->assertNotSame($first, $second);
        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($second);

        $this->actingAs($user)->delete(route('profile.avatar.destroy'))->assertRedirect();
        $this->assertNull($user->fresh()->profile->avatar_path);
        Storage::disk('public')->assertMissing($second);
    }

    public function test_rejects_non_images_and_large_files(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->create('cv.pdf', 10, 'application/pdf')])
            ->assertSessionHasErrors('avatar');
        $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('big.png')->size(3000)])
            ->assertSessionHasErrors('avatar');

        $this->assertNull($user->fresh()->profile->avatar_path);
    }

    public function test_deleting_account_removes_avatar_file(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => $this->webpUpload()]);
        $path = $user->fresh()->profile->avatar_path;

        $this->actingAs($user)->delete(route('profile.destroy'), ['password' => 'password'])->assertRedirect('/');

        Storage::disk('public')->assertMissing($path);
    }
}
