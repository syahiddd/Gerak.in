<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Workout;
use App\Models\WorkoutPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Stores workout photos on the public disk without leaking metadata.
 *
 * Phone photos carry EXIF (including GPS location). When GD can decode and
 * encode the format, the photo is resized and re-encoded, which drops all
 * metadata. Some PHP builds (e.g. php.new / Herd Lite) ship GD without JPEG
 * support; JPEGs are then kept as-is apart from their metadata segments,
 * which are cut out byte-wise. The browser already downsizes photos before
 * upload (resources/js/lib/image.ts), so size stays bounded either way.
 */
class WorkoutPhotoService
{
    public const MAX_PHOTOS = 4;

    private const MAX_EDGE = 1600;

    private const JPEG_QUALITY = 85;

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
            : [self::stripJpegMetadata($bytes), 'jpg', (int) $info[0], (int) $info[1]];

        $path = "workout-photos/{$workout->id}/".Str::random(24).'.'.$ext;
        Storage::disk('public')->put($path, $data);

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
        $write = (imagetypes() & IMG_JPG) || (imagetypes() & IMG_PNG);

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

        ob_start();
        $jpeg = (bool) (imagetypes() & IMG_JPG);
        $jpeg ? imagejpeg($dst, null, self::JPEG_QUALITY) : imagepng($dst, null, 8);
        $out = (string) ob_get_clean();
        imagedestroy($src);
        imagedestroy($dst);

        return [$out, $jpeg ? 'jpg' : 'png', $nw, $nh];
    }

    /**
     * Drops APP1–APP15 (EXIF/GPS, XMP, ICC extras, maker notes) and COM segments
     * from a JPEG, keeping the image data byte-for-byte. Note: the EXIF
     * orientation flag goes too; the browser already rotates pixels upright.
     */
    public static function stripJpegMetadata(string $jpeg): string
    {
        if (substr($jpeg, 0, 2) !== "\xFF\xD8") {
            throw ValidationException::withMessages(['photos' => 'One of the photos is not a valid JPG.']);
        }

        $out = "\xFF\xD8";
        $pos = 2;
        $len = strlen($jpeg);

        while ($pos + 4 <= $len) {
            if ($jpeg[$pos] !== "\xFF") {
                throw ValidationException::withMessages(['photos' => 'One of the photos is not a valid JPG.']);
            }
            $marker = ord($jpeg[$pos + 1]);
            if ($marker === 0xFF) { // fill byte
                $pos++;

                continue;
            }
            if ($marker === 0xDA) { // start of scan: the rest is image data
                return $out.substr($jpeg, $pos);
            }

            $segLen = (ord($jpeg[$pos + 2]) << 8) | ord($jpeg[$pos + 3]);
            $segment = substr($jpeg, $pos, 2 + $segLen);
            $isMetadata = ($marker >= 0xE1 && $marker <= 0xEF) || $marker === 0xFE;
            if (! $isMetadata) {
                $out .= $segment;
            }
            $pos += 2 + $segLen;
        }

        throw ValidationException::withMessages(['photos' => 'One of the photos is not a valid JPG.']);
    }
}
