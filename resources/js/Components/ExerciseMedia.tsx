import { useState } from 'react';
import { Exercise } from '@/types';

type Variant = 'thumbnail' | 'hero' | 'inline';

interface Props {
    exercise: Pick<Exercise, 'name' | 'image_url' | 'image_urls' | 'gif_url' | 'video_url' | 'image_path'>;
    variant?: Variant;
    className?: string;
}

type ImageUrls = Record<string, string>;

function asImageUrls(v: unknown): ImageUrls {
    if (!v) return {};
    if (typeof v === 'object') return v as ImageUrls;
    // Defensive: server sometimes serializes JSON columns as strings.
    if (typeof v === 'string') {
        try {
            const parsed: unknown = JSON.parse(v);
            if (parsed && typeof parsed === 'object') return parsed as ImageUrls;
        } catch {
            return { fallback: v };
        }
    }
    return {};
}

function pickPoster(ex: Props['exercise']): string | null {
    const urls = asImageUrls(ex.image_urls);
    return urls['720p'] ?? urls['480p'] ?? ex.image_url ?? ex.gif_url ?? ex.image_path ?? null;
}

function pickThumb(ex: Props['exercise']): string | null {
    const urls = asImageUrls(ex.image_urls);
    return urls['360p'] ?? urls['480p'] ?? ex.image_url ?? ex.gif_url ?? ex.image_path ?? null;
}

export default function ExerciseMedia({ exercise, variant = 'thumbnail', className = '' }: Props) {
    const [failed, setFailed] = useState(false);
    const [videoFailed, setVideoFailed] = useState(false);

    const videoUrl = exercise.video_url ?? undefined;
    const showVideo = variant === 'hero' && !!videoUrl && !videoFailed;

    if (showVideo) {
        const poster = pickPoster(exercise) ?? undefined;
        return (
            <div className={className}>
                <video
                    key={videoUrl}
                    src={videoUrl}
                    poster={poster}
                    controls
                    muted
                    loop
                    playsInline
                    preload="none"
                    onError={() => setVideoFailed(true)}
                    className="aspect-video w-full rounded-xl bg-zinc-100 object-cover dark:bg-zinc-800"
                    aria-label={`${exercise.name} demonstration video`}
                />
                <p className="mt-1 text-[11px] text-zinc-400">Demo video · ExerciseDB</p>
            </div>
        );
    }

    const src = variant === 'hero' ? pickPoster(exercise) : pickThumb(exercise);

    if (!src || failed) {
        return (
            <div
                className={`flex items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-800 ${
                    variant === 'hero' ? 'aspect-video' : variant === 'inline' ? 'h-10 w-10 text-xs' : 'aspect-video'
                } ${className}`}
                role="img"
                aria-label={`${exercise.name} (no demonstration media yet)`}
            >
                {variant === 'inline' ? '🏋️' : 'Demonstration media placeholder'}
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <img
                src={src}
                alt={`${exercise.name} demo`}
                loading="lazy"
                onError={() => setFailed(true)}
                className={`h-10 w-10 rounded-lg object-cover ${className}`}
            />
        );
    }

    return (
        <div className={className}>
            <img
                src={src}
                alt={`${exercise.name} demonstration`}
                loading="lazy"
                onError={() => setFailed(true)}
                className="aspect-video w-full rounded-xl bg-zinc-100 object-cover dark:bg-zinc-800"
            />
        </div>
    );
}
