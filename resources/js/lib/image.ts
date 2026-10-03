/**
 * Shrinks a photo in the browser before upload: longest edge ≤ maxEdge, JPEG.
 * Phone photos are often 3–8 MB; the server accepts up to 2 MB per file.
 * Re-encoding through a canvas also drops EXIF metadata such as GPS location.
 */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.85): Promise<File> {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.fillStyle = '#fff'; // flatten transparent PNGs onto white
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Could not encode image');

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
}

/**
 * Profile photo: center-crop to a square, scale to `size` and encode WebP.
 * Browsers that can't encode WebP (canvas falls back to PNG) get JPEG instead;
 * the server converts that to WebP when its GD supports it.
 */
export async function toSquareWebp(file: File, size = 512, quality = 0.8): Promise<File> {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const side = Math.min(bitmap.width, bitmap.height);
    const out = Math.min(size, side);

    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, out, out);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);
    bitmap.close();

    const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await encode('image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg');
    if (!blob) throw new Error('Could not encode image');

    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `avatar.${ext}`, { type: blob.type });
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
