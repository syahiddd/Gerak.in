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
