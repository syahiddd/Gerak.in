<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Validation\ValidationException;

/**
 * Removes metadata (EXIF incl. GPS location, XMP, comments) from image bytes
 * without re-encoding. Used when GD on the server can't decode/encode the
 * format (e.g. php.new / Herd Lite builds ship GD without JPEG or WebP).
 */
class ImageMetadata
{
    /**
     * Drops APP1–APP15 (EXIF/GPS, XMP, maker notes) and COM segments from a
     * JPEG, keeping the image data byte-for-byte. The EXIF orientation flag
     * goes too; the browser already rotates pixels upright before upload.
     */
    public static function stripJpeg(string $jpeg, string $field = 'photos'): string
    {
        $invalid = fn () => ValidationException::withMessages([$field => 'The image is not a valid JPG.']);

        if (substr($jpeg, 0, 2) !== "\xFF\xD8") {
            throw $invalid();
        }

        $out = "\xFF\xD8";
        $pos = 2;
        $len = strlen($jpeg);

        while ($pos + 4 <= $len) {
            if ($jpeg[$pos] !== "\xFF") {
                throw $invalid();
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
            $isMetadata = ($marker >= 0xE1 && $marker <= 0xEF) || $marker === 0xFE;
            if (! $isMetadata) {
                $out .= substr($jpeg, $pos, 2 + $segLen);
            }
            $pos += 2 + $segLen;
        }

        throw $invalid();
    }

    /**
     * Drops EXIF and XMP chunks from a WebP (RIFF) file, clears their flags in
     * the VP8X header and rewrites the RIFF size. Image chunks are untouched.
     */
    public static function stripWebp(string $webp, string $field = 'avatar'): string
    {
        $invalid = fn () => ValidationException::withMessages([$field => 'The image is not a valid WebP.']);

        if (strlen($webp) < 12 || substr($webp, 0, 4) !== 'RIFF' || substr($webp, 8, 4) !== 'WEBP') {
            throw $invalid();
        }

        $body = '';
        $pos = 12;
        $len = strlen($webp);

        while ($pos + 8 <= $len) {
            $fourcc = substr($webp, $pos, 4);
            $size = unpack('V', substr($webp, $pos + 4, 4))[1];
            $padded = $size + ($size & 1); // chunks are padded to an even length
            if ($pos + 8 + $size > $len) {
                throw $invalid();
            }
            $chunk = substr($webp, $pos, 8 + $padded);

            if ($fourcc === 'VP8X') {
                // Flags byte: bit 3 = EXIF, bit 2 = XMP.
                $chunk[8] = chr(ord($chunk[8]) & ~0x0C);
            }
            if ($fourcc !== 'EXIF' && $fourcc !== 'XMP ') {
                $body .= $chunk;
            }
            $pos += 8 + $padded;
        }

        if ($body === '') {
            throw $invalid();
        }

        return 'RIFF'.pack('V', 4 + strlen($body)).'WEBP'.$body;
    }
}
