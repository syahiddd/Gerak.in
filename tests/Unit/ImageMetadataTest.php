<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\ImageMetadata;
use PHPUnit\Framework\TestCase;
use Tests\Feature\Social\AvatarTest;

class ImageMetadataTest extends TestCase
{
    public function test_strip_webp_removes_exif_chunk_and_flag(): void
    {
        $clean = ImageMetadata::stripWebp(AvatarTest::webpWithExif());

        $this->assertStringNotContainsString('EXIF', $clean);
        $this->assertStringNotContainsString('GPS-LAT', $clean);
        $this->assertSame(0, ord($clean[20]) & 0x0C, 'VP8X EXIF/XMP flags must be cleared');
        $this->assertSame(strlen($clean) - 8, unpack('V', substr($clean, 4, 4))[1], 'RIFF size must match');
        $this->assertSame('image/webp', getimagesizefromstring($clean)['mime']);
    }

    public function test_strip_webp_keeps_simple_files_intact(): void
    {
        $plain = base64_decode('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');

        $this->assertSame($plain, ImageMetadata::stripWebp($plain));
    }
}
