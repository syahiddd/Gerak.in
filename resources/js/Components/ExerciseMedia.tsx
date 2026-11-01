import { useEffect, useRef, useState } from 'react';
import { Exercise } from '@/types';
import { Dumbbell, Pause, Play } from 'lucide-react';

type Variant = 'thumbnail' | 'hero' | 'inline';

interface Props {
    exercise: Pick<Exercise, 'name' | 'image_url' | 'image_urls' | 'gif_url' | 'video_url' | 'image_path'> & Partial<Pick<Exercise, 'media_credit' | 'media_source'>>;
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
    return ex.gif_url ?? urls['360p'] ?? urls['480p'] ?? ex.image_url ?? ex.image_path ?? null;
}

/** A static picture of the exercise, used while its GIF is paused. */
function pickStill(ex: Props['exercise']): string | null {
    const urls = asImageUrls(ex.image_urls);
    return urls['480p'] ?? urls['360p'] ?? urls['720p'] ?? ex.image_url ?? ex.image_path ?? null;
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Draws the first frame of a GIF to a data URL; null until ready, 'tainted' if the image is cross-origin. */
function useStillFrame(src: string | null, onError: () => void): string | null | 'tainted' {
    const [still, setStill] = useState<string | null | 'tainted'>(null);

    useEffect(() => {
        if (!src) return;
        let cancelled = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
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
        img.onerror = () => {
            if (cancelled) return;
            // CORS refused: check the plain image loads, then fall back to the placeholder while paused.
            if (img.crossOrigin) {
                const fallback = new Image();
                fallback.onload = () => {
                    if (!cancelled) setStill('tainted');
                };
                fallback.onerror = () => {
                    if (!cancelled) onError();
                };
                fallback.src = src;
                return;
            }
            onError();
        };
        img.src = src;

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    return still;
}

/**
 * A GIF that never loops on its own (WCAG 2.2.2): `still` shows one frame, `hover` plays while the
 * surrounding card is hovered or focused, `toggle` has a Play/Pause button and starts paused when
 * the user prefers reduced motion.
 */
function Gif({
    src,
    poster,
    name,
    mode,
    decorative,
    box,
    onError,
}: {
    src: string;
    poster: string | null;
    name: string;
    mode: 'still' | 'hover' | 'toggle';
    decorative: boolean;
    box: string;
    onError: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [toggled, setToggled] = useState(() => mode === 'toggle' && !prefersReducedMotion());
    const frame = useStillFrame(poster ? null : src, onError);
    const stillSrc = poster ?? (frame && frame !== 'tainted' ? frame : null);

    useEffect(() => {
        if (mode !== 'hover') return;
        const trigger = ref.current?.closest<HTMLElement>('a, button') ?? ref.current;
        if (!trigger) return;
        const on = () => setHovered(true);
        const off = () => setHovered(false);
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
    }, [mode]);

    const playing = mode === 'hover' ? hovered : mode === 'toggle' ? toggled : false;

    return (
        <div ref={ref} className={`relative ${box}`}>
            <div
                role={decorative ? undefined : 'img'}
                aria-label={decorative ? undefined : `${name} demonstration`}
                aria-hidden={decorative || undefined}
                className="absolute inset-0 overflow-hidden rounded-[inherit] bg-white"
            >
                {stillSrc ? (
                    <img src={stillSrc} alt="" className="absolute inset-0 h-full w-full object-contain" />
                ) : (
                    !playing && (
                        <span className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            <Dumbbell className="h-1/3 max-h-7 w-1/3 max-w-7" />
                        </span>
                    )
                )}
                {/* Mounted only while playing so the animation restarts from the first frame. */}
                {playing && <img src={src} alt="" onError={onError} className="absolute inset-0 h-full w-full object-contain" />}
                {mode === 'hover' && (
                    <span
                        className={`absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-lime-400 transition-opacity duration-200 ${
                            playing ? 'opacity-0' : 'opacity-100'
                        }`}
                    >
                        <Play className="ml-0.5 h-3 w-3 fill-current" />
                    </span>
                )}
            </div>
            {mode === 'toggle' && (
                <button
                    type="button"
                    onClick={() => setToggled((p) => !p)}
                    aria-pressed={playing}
                    aria-label={`Play ${name} animation`}
                    className="absolute bottom-2 left-2 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950/80 text-lime-400 hover:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2"
                >
                    {playing ? <Pause className="h-4 w-4 fill-current" aria-hidden /> : <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />}
                </button>
            )}
        </div>
    );
}

export default function ExerciseMedia({ exercise, variant = 'thumbnail', className = '', playOnHover = false }: Props) {
    const [failed, setFailed] = useState(false);
    const [videoFailed, setVideoFailed] = useState(false);
    // Inline and thumbnail media always sit next to the exercise name, so they add no text of their own.
    const decorative = variant !== 'hero';

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
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Demo video{exercise.media_source === 'exercisedb' ? ' · ExerciseDB' : ''}</p>
            </div>
        );
    }

    const src = variant === 'hero' ? (exercise.gif_url ?? pickPoster(exercise)) : pickThumb(exercise);
    const isGif = !!exercise.gif_url && src === exercise.gif_url;
    // WorkoutX GIFs have a white background; contain them so limbs aren't cropped.
    const fit = isGif ? 'bg-white object-contain' : 'bg-zinc-100 object-cover dark:bg-zinc-800';
    const box = variant === 'inline' ? `h-10 w-10 shrink-0 rounded-lg ${className}` : 'aspect-video w-full rounded-xl';

    if (!src || failed) {
        return (
            <div
                className={`flex flex-col items-center justify-center gap-1 rounded-xl bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 ${
                    variant === 'inline' ? 'h-10 w-10 shrink-0' : 'aspect-video'
                } ${className}`}
                role={decorative ? undefined : 'img'}
                aria-label={decorative ? undefined : `${exercise.name} (no demonstration media yet)`}
                aria-hidden={decorative || undefined}
            >
                <Dumbbell className={variant === 'inline' ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden />
                {variant !== 'inline' && <span>No demo yet</span>}
            </div>
        );
    }

    if (isGif) {
        const mode = variant === 'inline' ? 'still' : playOnHover ? 'hover' : 'toggle';
        const gif = <Gif src={src} poster={pickStill(exercise)} name={exercise.name} mode={mode} decorative={decorative} box={box} onError={() => setFailed(true)} />;

        if (variant === 'inline') return gif;

        return (
            <div className={className}>
                {gif}
                {variant === 'hero' && <MediaCredit credit={exercise.media_credit} />}
            </div>
        );
    }

    if (variant === 'inline') {
        return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`h-10 w-10 shrink-0 rounded-lg ${fit} ${className}`} />;
    }

    return (
        <div className={className}>
            <img
                src={src}
                alt={decorative ? '' : `${exercise.name} demonstration`}
                loading="lazy"
                onError={() => setFailed(true)}
                className={`aspect-video w-full rounded-xl ${fit}`}
            />
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
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Animation ©{' '}
                <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-900 dark:hover:text-white">
                    Gym visual
                </a>
            </p>
        );
    }

    return <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Animation · WorkoutX</p>;
}
