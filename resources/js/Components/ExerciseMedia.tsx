import { useEffect, useRef, useState } from 'react';
import { Exercise } from '@/types';

type Variant = 'thumbnail' | 'hero' | 'inline';

interface Props {
    exercise: Pick<Exercise, 'name' | 'image_url' | 'image_urls' | 'gif_url' | 'video_url' | 'image_path'> & Partial<Pick<Exercise, 'media_credit'>>;
    variant?: Variant;
    className?: string;
    /** Freeze GIFs on their first frame; play while the parent card is hovered/focused. */
    playOnHover?: boolean;
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
    return ex.gif_url ?? urls['360p'] ?? urls['480p'] ?? ex.image_url ?? ex.gif_url ?? ex.image_path ?? null;
}

/** Draws the first frame of a GIF to a data URL; null until ready or if the image is cross-origin. */
function useStillFrame(src: string, onError: () => void): string | null | 'tainted' {
    const [still, setStill] = useState<string | null | 'tainted'>(null);

    useEffect(() => {
        let cancelled = false;
        const img = new Image();
        img.onload = () => {
            if (cancelled) return;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext('2d')?.drawImage(img, 0, 0);
                setStill(canvas.toDataURL('image/png'));
            } catch {
                setStill('tainted');
            }
        };
        img.onerror = () => !cancelled && onError();
        img.src = src;

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    return still;
}

/**
 * GIF that stays on its first frame and only plays while the surrounding
 * card (closest link/button) is hovered or keyboard-focused.
 */
function HoverGif({ src, name, className, onError }: { src: string; name: string; className: string; onError: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const still = useStillFrame(src, onError);

    useEffect(() => {
        const trigger = ref.current?.closest<HTMLElement>('a, button') ?? ref.current;
        if (!trigger) return;
        const on = () => setActive(true);
        const off = () => setActive(false);
        trigger.addEventListener('mouseenter', on);
        trigger.addEventListener('mouseleave', off);
        trigger.addEventListener('focus', on);
        trigger.addEventListener('blur', off);

        return () => {
            trigger.removeEventListener('mouseenter', on);
            trigger.removeEventListener('mouseleave', off);
            trigger.removeEventListener('focus', on);
            trigger.removeEventListener('blur', off);
        };
    }, []);

    // Cross-origin GIFs can't be frozen via canvas; show them animated as before.
    const playing = active || still === 'tainted';

    return (
        <div ref={ref} className={`relative aspect-video overflow-hidden rounded-xl bg-white ${className}`}>
            {still && still !== 'tainted' && (
                <img src={still} alt={`${name} demonstration`} className="absolute inset-0 h-full w-full object-contain" />
            )}
            {/* Mounted only while playing so the animation restarts from the first frame. */}
            {playing && (
                <img
                    src={src}
                    alt={still === 'tainted' ? `${name} demonstration` : ''}
                    aria-hidden={still !== 'tainted'}
                    onError={onError}
                    className="absolute inset-0 h-full w-full object-contain"
                />
            )}
            {still !== 'tainted' && (
                <span
                    aria-hidden
                    className={`absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-lime-400 transition-opacity duration-200 ${
                        active ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                    <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3 fill-current">
                        <path d="M2 1.2v9.6L10.4 6z" />
                    </svg>
                </span>
            )}
        </div>
    );
}

export default function ExerciseMedia({ exercise, variant = 'thumbnail', className = '', playOnHover = false }: Props) {
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

    const src = variant === 'hero' ? (exercise.gif_url ?? pickPoster(exercise)) : pickThumb(exercise);
    const isGif = !!exercise.gif_url && src === exercise.gif_url;
    // WorkoutX GIFs have a white background; contain them so limbs aren't cropped.
    const fit = isGif ? 'bg-white object-contain' : 'bg-zinc-100 object-cover dark:bg-zinc-800';

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
                className={`h-10 w-10 rounded-lg ${fit} ${className}`}
            />
        );
    }

    if (playOnHover && isGif) {
        return <HoverGif src={src} name={exercise.name} className={className} onError={() => setFailed(true)} />;
    }

    return (
        <div className={className}>
            <img
                src={src}
                alt={`${exercise.name} demonstration`}
                loading="lazy"
                onError={() => setFailed(true)}
                className={`aspect-video w-full rounded-xl ${fit}`}
            />
            {variant === 'hero' && isGif && <MediaCredit credit={exercise.media_credit} />}
        </div>
    );
}

/**
 * Animation credit under large media. Gym visual media (exercises-dataset) is
 * shared on the condition that "© Gym visual — https://gymvisual.com/" accompanies it.
 */
export function MediaCredit({ credit }: { credit?: 'gymvisual' | 'workoutx' | null }) {
    if (credit === 'gymvisual') {
        return (
            <p className="mt-1 text-[11px] text-zinc-400">
                Animation ©{' '}
                <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600 dark:hover:text-zinc-200">
                    Gym visual
                </a>
            </p>
        );
    }

    return <p className="mt-1 text-[11px] text-zinc-400">Animation · WorkoutX</p>;
}
