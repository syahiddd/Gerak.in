<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Support\ImageMetadata;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Profile photos, stored as small square WebP files.
 *
 * The browser already center-crops to 512×512 and encodes WebP before upload
 * (resources/js/lib/image.ts). When GD on the server can encode WebP, the
 * upload is re-encoded here as well, so any client or format ends up the same.
 * Without WebP in GD (php.new / Herd Lite), the browser's WebP is kept and
 * only its metadata is stripped; old browsers that can't make WebP send JPEG/PNG.
 */
class AvatarService
{
    public const SIZE = 512;

    private const WEBP_QUALITY = 80;

    public function update(User $user, UploadedFile $file): string
    {
        $bytes = (string) file_get_contents($file->getRealPath());
        $type = @getimagesizefromstring($bytes)[2] ?? null;

        if (! in_array($type, [IMAGETYPE_WEBP, IMAGETYPE_JPEG, IMAGETYPE_PNG], true)) {
            throw ValidationException::withMessages(['avatar' => 'Use a WebP, JPG or PNG image.']);
        }

        [$data, $ext] = $this->canEncodeWebp($type)
            ? [$this->squareWebp($bytes), 'webp']
            : $this->passThrough($bytes, $type);

        $path = "avatars/{$user->id}/".Str::random(24).'.'.$ext;
        Storage::disk('public')->put($path, $data);

        // Swap only after the new file is safely stored.
        $profile = $user->profile()->firstOrCreate([]);
        $old = $profile->avatar_path;
        $profile->update(['avatar_path' => $path]);
        $user->setRelation('profile', $profile);
        if ($old) {
            Storage::disk('public')->delete($old);
        }

        return $path;
    }

    public function remove(User $user): void
    {
        // Query fresh: $user->profile may be a stale copy cached earlier in the request.
        $profile = $user->profile()->first();
        if ($profile?->avatar_path) {
            Storage::disk('public')->delete($profile->avatar_path);
            $profile->update(['avatar_path' => null]);
        }
        $user->setRelation('profile', $profile);
    }

    private function canEncodeWebp(int $type): bool
    {
        if (! function_exists('imagewebp') || ! function_exists('imagetypes')) {
            return false;
        }
        $read = match ($type) {
            IMAGETYPE_WEBP => IMG_WEBP,
            IMAGETYPE_JPEG => IMG_JPG,
            default => IMG_PNG,
        };

        return (bool) (imagetypes() & $read) && (bool) (imagetypes() & IMG_WEBP);
    }

    /** Center-crop to a square, scale to SIZE and encode WebP (drops all metadata). */
    private function squareWebp(string $bytes): string
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            throw ValidationException::withMessages(['avatar' => 'The photo could not be read.']);
        }

        $w = imagesx($src);
        $h = imagesy($src);
        $side = min($w, $h);
        $size = min(self::SIZE, $side);

        $dst = imagecreatetruecolor($size, $size);
        imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
        imagecopyresampled($dst, $src, 0, 0, intdiv($w - $side, 2), intdiv($h - $side, 2), $size, $size, $side, $side);

        ob_start();
        imagewebp($dst, null, self::WEBP_QUALITY);
        $out = (string) ob_get_clean();
        imagedestroy($src);
        imagedestroy($dst);

        return $out;
    }

    /** @return array{0:string,1:string} bytes, extension */
    private function passThrough(string $bytes, int $type): array
    {
        return match ($type) {
            IMAGETYPE_WEBP => [ImageMetadata::stripWebp($bytes), 'webp'],
            IMAGETYPE_JPEG => [ImageMetadata::stripJpeg($bytes, 'avatar'), 'jpg'],
            default => [$this->reencodePng($bytes), 'png'],
        };
    }

    /** PNG has no EXIF in practice, but re-encoding via GD guarantees a clean file. */
    private function reencodePng(string $bytes): string
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            throw ValidationException::withMessages(['avatar' => 'The photo could not be read.']);
        }
        ob_start();
        imagepng($src, null, 8);
        $out = (string) ob_get_clean();
        imagedestroy($src);

        return $out;
    }
}
