<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Workout;
use App\Models\WorkoutPhoto;
use App\Support\ImageMetadata;
use App\Support\MediaStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Stores workout photos (see MediaStorage) without leaking metadata.
 *
 * Phone photos carry EXIF (including GPS location). When GD can decode the
 * format, the photo is resized and re-encoded as WebP (JPEG/PNG if GD lacks
 * WebP), which drops all metadata and keeps the bucket small. Some PHP builds
 * (e.g. php.new / Herd Lite) ship GD without JPEG support; JPEGs are then kept
 * as-is apart from their metadata segments, which are cut out byte-wise.
 */
class WorkoutPhotoService
{
    public const MAX_PHOTOS = 4;

    private const MAX_EDGE = 1600;

    private const JPEG_QUALITY = 85;

    private const WEBP_QUALITY = 80;

    private const MIME = ['webp' => 'image/webp', 'jpg' => 'image/jpeg', 'png' => 'image/png'];

    /**
     * @param  UploadedFile[]  $files
     * @param  int[]  $removeIds
     */
    public function sync(Workout $workout, array $files, array $removeIds): void
    {
        $toRemove = $workout->photos()->whereIn('id', $removeIds)->get();

        // Check the limit before touching anything so a rejected save loses nothing.
        if ($workout->photos()->count() - $toRemove->count() + count($files) > self::MAX_PHOTOS) {
            throw ValidationException::withMessages([
                'photos' => 'A workout can have up to '.self::MAX_PHOTOS.' photos.',
            ]);
        }

        // Delete one by one so the model event removes each file.
        $toRemove->each->delete();

        $order = (int) $workout->photos()->max('order');
        foreach ($files as $file) {
            $this->store($workout, $file, ++$order);
        }
    }

    private function store(Workout $workout, UploadedFile $file, int $order): WorkoutPhoto
    {
        $bytes = (string) file_get_contents($file->getRealPath());
        $info = @getimagesizefromstring($bytes);
        $type = $info[2] ?? null;

        if (! in_array($type, [IMAGETYPE_JPEG, IMAGETYPE_PNG], true)) {
            throw ValidationException::withMessages(['photos' => 'Photos must be JPG or PNG.']);
        }

        [$data, $ext, $width, $height] = $this->canReencode($type)
            ? $this->reencode($bytes)
            : [ImageMetadata::stripJpeg($bytes), 'jpg', (int) $info[0], (int) $info[1]];

        $path = "workout-photos/{$workout->id}/".Str::random(24).'.'.$ext;
        MediaStorage::put($path, $data, self::MIME[$ext], 'photos');

        return $workout->photos()->create([
            'path' => $path,
            'width' => $width,
            'height' => $height,
            'order' => $order,
        ]);
    }

    private function canReencode(int $type): bool
    {
        if (! function_exists('imagetypes')) {
            return false;
        }
        $read = $type === IMAGETYPE_JPEG ? IMG_JPG : IMG_PNG;
        $write = (imagetypes() & IMG_WEBP) || (imagetypes() & IMG_JPG) || (imagetypes() & IMG_PNG);

        return (bool) (imagetypes() & $read) && $write;
    }

    /** @return array{0:string,1:string,2:int,3:int} bytes, extension, width, height */
    private function reencode(string $bytes): array
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            throw ValidationException::withMessages(['photos' => 'One of the photos could not be read. Use a JPG or PNG image.']);
        }

        [$w, $h] = [imagesx($src), imagesy($src)];
        $scale = min(1, self::MAX_EDGE / max($w, $h));
        [$nw, $nh] = [max(1, (int) round($w * $scale)), max(1, (int) round($h * $scale))];

        $dst = imagecreatetruecolor($nw, $nh);
        // Flatten transparency (PNG) onto white instead of black.
        imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

        $ext = match (true) {
            function_exists('imagewebp') && (bool) (imagetypes() & IMG_WEBP) => 'webp',
            (bool) (imagetypes() & IMG_JPG) => 'jpg',
            default => 'png',
        };

        ob_start();
        match ($ext) {
            'webp' => imagewebp($dst, null, self::WEBP_QUALITY),
            'jpg' => imagejpeg($dst, null, self::JPEG_QUALITY),
            'png' => imagepng($dst, null, 8),
        };
        $out = (string) ob_get_clean();
        imagedestroy($src);
        imagedestroy($dst);

        return [$out, $ext, $nw, $nh];
    }
}
