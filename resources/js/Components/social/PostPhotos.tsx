import { PostPhoto } from '@/types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Swipeable photo strip (scroll-snap) with dots; tap a photo to view it full screen.
 * One photo fills the width; several scroll horizontally like a carousel.
 */
export default function PostPhotos({ photos, alt, className = '' }: { photos: PostPhoto[]; alt: string; className?: string }) {
    const track = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState<number | null>(null);

    const onScroll = () => {
        const el = track.current;
        if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
    };

    const go = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' });

    if (photos.length === 0) return null;

    return (
        <div className={`relative ${className}`}>
            <div
                ref={track}
                onScroll={onScroll}
                className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl bg-zinc-100 [scrollbar-width:none] dark:bg-zinc-950 [&::-webkit-scrollbar]:hidden"
            >
                {photos.map((p, i) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => setOpen(i)}
                        className="aspect-[4/3] w-full shrink-0 snap-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-400"
                        aria-label={`Open photo ${i + 1} of ${photos.length}`}
                    >
                        <img src={p.url} alt={`${alt}, photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                    </button>
                ))}
            </div>

            {photos.length > 1 && (
                <>
                    <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                        {photos.map((p, i) => (
                            <span key={p.id} className={`h-1.5 rounded-full bg-white shadow transition-all ${i === index ? 'w-4 opacity-100' : 'w-1.5 opacity-60'}`} />
                        ))}
                    </div>
                    {index > 0 && (
                        <ArrowButton side="left" onClick={() => go(index - 1)} />
                    )}
                    {index < photos.length - 1 && (
                        <ArrowButton side="right" onClick={() => go(index + 1)} />
                    )}
                </>
            )}

            {open !== null && <Lightbox photos={photos} start={open} alt={alt} onClose={() => setOpen(null)} />}
        </div>
    );
}

function ArrowButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
            className={`absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950/60 text-white hover:bg-zinc-950/80 sm:flex ${side === 'left' ? 'left-2' : 'right-2'}`}
        >
            <Icon className="h-5 w-5" />
        </button>
    );
}

function Lightbox({ photos, start, alt, onClose }: { photos: PostPhoto[]; start: number; alt: string; onClose: () => void }) {
    const [i, setI] = useState(start);
    const prev = useCallback(() => setI((n) => Math.max(0, n - 1)), []);
    const next = useCallback(() => setI((n) => Math.min(photos.length - 1, n + 1)), [photos.length]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        document.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
        };
    }, [onClose, prev, next]);

    return (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/95 p-4" onClick={onClose}>
            <img src={photos[i].url} alt={`${alt}, photo ${i + 1}`} className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
            <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                <X className="h-5 w-5" />
            </button>
            {photos.length > 1 && (
                <>
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70 tabular-nums">
                        {i + 1} / {photos.length}
                    </p>
                    {i > 0 && (
                        <button type="button" onClick={(e) => (e.stopPropagation(), prev())} aria-label="Previous photo" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}
                    {i < photos.length - 1 && (
                        <button type="button" onClick={(e) => (e.stopPropagation(), next())} aria-label="Next photo" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
