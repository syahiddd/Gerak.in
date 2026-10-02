<?php

declare(strict_types=1);

namespace Tests\Feature\Social;

use App\Models\User;
use App\Models\Workout;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WorkoutPhotoTest extends TestCase
{
    use CreatesPosts, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function upload(User $user, Workout $workout, array $photos, array $remove = [])
    {
        return $this->actingAs($user)->post(route('workouts.update', $workout), [
            '_method' => 'patch',
            'from_save' => true,
            'photos' => $photos,
            'remove_photo_ids' => $remove,
        ]);
    }

    /** Smallest valid JPEG (1x1) with an EXIF APP1 segment carrying a fake GPS marker. */
    private function jpegWithExif(): UploadedFile
    {
        $jpeg = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');
        $payload = "Exif\0\0GPS-LAT-6.2088-LNG-106.8456";
        $app1 = "\xFF\xE1".pack('n', strlen($payload) + 2).$payload;
        $path = tempnam(sys_get_temp_dir(), 'jpg');
        file_put_contents($path, substr($jpeg, 0, 2).$app1.substr($jpeg, 2));

        return new UploadedFile($path, 'gym.jpg', 'image/jpeg', null, true);
    }

    public function test_png_is_resized_and_shown_on_the_post(): void
    {
        $owner = User::factory()->create();
        $workout = $this->makePost($owner);

        $this->upload($owner, $workout, [UploadedFile::fake()->image('big.png', 3200, 2400)])
            ->assertRedirect(route('posts.show', $workout));

        $photo = $workout->photos()->firstOrFail();
        $this->assertSame(1600, $photo->width);
        $this->assertSame(1200, $photo->height);
        Storage::disk('public')->assertExists($photo->path);
        $this->assertContains(getimagesizefromstring(Storage::disk('public')->get($photo->path))['mime'], ['image/jpeg', 'image/png']);

        $this->actingAs($owner)->get(route('posts.show', $workout))
            ->assertInertia(fn ($page) => $page->where('post.photos.0.url', '/storage/'.$photo->path));
    }

    public function test_jpeg_location_metadata_is_removed(): void
    {
        $owner = User::factory()->create();
        $workout = $this->makePost($owner);

        $this->upload($owner, $workout, [$this->jpegWithExif()])->assertSessionHasNoErrors();

        $stored = Storage::disk('public')->get($workout->photos()->value('path'));
        $this->assertStringNotContainsString('GPS-LAT', $stored);
        $this->assertSame('image/jpeg', getimagesizefromstring($stored)['mime']);
    }

    public function test_limit_is_checked_before_anything_is_removed(): void
    {
        $owner = User::factory()->create();
        $workout = $this->makePost($owner);
        $this->upload($owner, $workout, [
            UploadedFile::fake()->image('1.png'), UploadedFile::fake()->image('2.png'), UploadedFile::fake()->image('3.png'),
        ]);
        $first = $workout->photos()->first();

        // 3 existing - 1 removed + 3 new = 5 > 4 → rejected, and the removal must not happen.
        $this->upload($owner, $workout, [
            UploadedFile::fake()->image('4.png'), UploadedFile::fake()->image('5.png'), UploadedFile::fake()->image('6.png'),
        ], [$first->id])->assertSessionHasErrors('photos');

        $this->assertSame(3, $workout->photos()->count());
        Storage::disk('public')->assertExists($first->path);
    }

    public function test_removing_a_photo_deletes_the_file(): void
    {
        $owner = User::factory()->create();
        $workout = $this->makePost($owner);
        $this->upload($owner, $workout, [UploadedFile::fake()->image('a.png')]);
        $photo = $workout->photos()->firstOrFail();

        $this->upload($owner, $workout, [], [$photo->id])->assertSessionHasNoErrors();

        $this->assertSame(0, $workout->photos()->count());
        Storage::disk('public')->assertMissing($photo->path);
    }

    public function test_deleting_the_workout_deletes_its_photos(): void
    {
        $owner = User::factory()->create();
        $workout = $this->makePost($owner);
        $this->upload($owner, $workout, [UploadedFile::fake()->image('a.png')]);
        $path = $workout->photos()->value('path');

        $this->actingAs($owner)->delete(route('workouts.destroy', $workout))->assertRedirect();

        Storage::disk('public')->assertMissing($path);
    }

    public function test_rejects_non_images_large_files_and_other_users(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $workout = $this->makePost($owner);

        $this->upload($owner, $workout, [UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')])->assertSessionHasErrors('photos.0');
        $this->upload($owner, $workout, [UploadedFile::fake()->image('huge.png')->size(3000)])->assertSessionHasErrors('photos.0');
        $this->upload($other, $workout, [UploadedFile::fake()->image('a.png')])->assertForbidden();

        $this->assertSame(0, $workout->photos()->count());
    }
}
