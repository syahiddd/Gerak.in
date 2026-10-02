import { displayWeight, formatNumber } from '@/lib/units';
import { Celebration, FeedPost, PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { Trophy } from 'lucide-react';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { humanDuration } from './format';

const CONFETTI_COLORS = ['bg-lime-400', 'bg-lime-300', 'bg-amber-400', 'bg-sky-400', 'bg-rose-400', 'bg-white'];

function usePrefersReducedMotion(): boolean {
    const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return reduced;
}

/** Eases a number from 0 to target; jumps straight to target when motion is reduced. */
function useCountUp(target: number, delayMs: number, animate: boolean): number {
    const [value, setValue] = useState(animate ? 0 : target);

    useEffect(() => {
        if (!animate) return setValue(target);
        let raf = 0;
        const start = performance.now() + delayMs;
        const tick = (now: number) => {
            const t = Math.min(1, Math.max(0, (now - start) / 900));
            setValue(target * (1 - Math.pow(1 - t, 3)));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, delayMs, animate]);

    return value;
}

function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Full-screen "workout complete" moment shown once, right after Finish:
 * a ring that closes into a check, a confetti burst, counted-up stats and any PRs.
 */
export default function WorkoutCelebration({ celebrate, post, onClose }: { celebrate: Celebration; post: FeedPost; onClose: () => void }) {
    const animate = !usePrefersReducedMotion();
    const unit = usePage<PageProps>().props.auth.user.settings?.unit_system ?? 'metric';
    const cta = useRef<HTMLButtonElement>(null);

    const vol = displayWeight(post.volume_kg ?? 0, unit);
    const volume = useCountUp(Number(vol.value) || 0, 700, animate);
    const sets = useCountUp(post.sets_count, 800, animate);

    // Random but stable per mount: each piece flies out on its own angle, then drifts down.
    const confetti = useMemo(
        () =>
            Array.from({ length: 44 }, (_, i) => {
                const angle = (i / 44) * Math.PI * 2 + Math.random() * 0.4;
                const dist = 140 + Math.random() * 220;
                return {
                    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    round: i % 3 === 0,
                    style: {
                        '--x': `${Math.cos(angle) * dist}px`,
                        '--y': `${Math.sin(angle) * dist + 90}px`,
                        '--r': `${Math.random() * 720 - 360}deg`,
                        animationDelay: `${250 + Math.random() * 150}ms`,
                    } as CSSProperties,
                };
            }),
        [],
    );

    useEffect(() => {
        // Focus the CTA for keyboard users without scrolling the ring out of view.
        cta.current?.focus({ preventScroll: true });
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
        };
    }, [onClose]);

    // One card per exercise; a single lift often sets several record types at once.
    const prsByExercise = Object.entries(
        (celebrate.pr_events ?? []).reduce<Record<string, Celebration['pr_events']>>((acc, pr) => {
            (acc[pr.exercise] ??= []).push(pr);
            return acc;
        }, {}),
    );
    const RING = 2 * Math.PI * 54;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="celebration-title"
            className="fixed inset-0 z-[70] overflow-y-auto bg-zinc-950/95 text-white backdrop-blur-sm"
        >
            {/* min-h-full + flex centering keeps tall content scrollable instead of clipped at the top */}
            <div className="flex min-h-full items-center justify-center px-5 py-10">
                <div className="relative w-full max-w-md text-center">
                    {/* Ring + check */}
                    <div className="relative mx-auto h-36 w-36">
                        {animate &&
                            confetti.map((c, i) => (
                                <span
                                    key={i}
                                    aria-hidden
                                    style={c.style}
                                    className={`absolute left-1/2 top-1/2 animate-confetti ${c.color} ${c.round ? 'h-2 w-2 rounded-full' : 'h-3 w-1.5 rounded-sm'}`}
                                />
                            ))}
                        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
                            <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-white/10" />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={RING}
                                style={{ '--dash': RING } as CSSProperties}
                                className="stroke-lime-400 motion-safe:animate-ring-draw"
                            />
                        </svg>
                        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden>
                            <path
                                d="M40 62 l14 14 l27 -30"
                                fill="none"
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="70"
                                style={{ '--dash': 70, animationDelay: '750ms' } as CSSProperties}
                                className="stroke-lime-400 motion-safe:animate-ring-draw"
                            />
                        </svg>
                    </div>

                    <p className="mt-7 text-xs font-bold uppercase tracking-[0.25em] text-lime-400 motion-safe:animate-rise" style={{ animationDelay: '500ms' }}>
                        Workout #{celebrate.workout_number}
                    </p>
                    <h2 id="celebration-title" className="mt-2 text-4xl font-black tracking-tight motion-safe:animate-rise sm:text-5xl" style={{ animationDelay: '600ms' }}>
                        Workout complete
                    </h2>
                    <p className="mt-2 text-zinc-400 motion-safe:animate-rise" style={{ animationDelay: '700ms' }}>
                        That&apos;s your {ordinal(celebrate.workout_number)} workout on Gerak.in. Keep it rolling.
                    </p>

                    <dl className="mt-8 grid grid-cols-3 gap-2 motion-safe:animate-rise" style={{ animationDelay: '800ms' }}>
                        <Stat label="Time" value={humanDuration(post.duration_seconds)} />
                        <Stat label="Volume" value={post.volume_kg ? `${formatNumber(Math.round(volume))} ${vol.unit}` : '—'} />
                        <Stat label="Sets" value={String(Math.round(sets))} />
                    </dl>

                    {prsByExercise.length > 0 && (
                        <div className="mt-4 space-y-2 text-left">
                            {prsByExercise.map(([exercise, records], i) => (
                                <div
                                    key={exercise}
                                    className="flex gap-3 rounded-xl bg-amber-400/10 px-4 py-3 ring-1 ring-amber-400/40 motion-safe:animate-pop"
                                    style={{ animationDelay: `${1000 + i * 120}ms` }}
                                >
                                    <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
                                    <div className="min-w-0 text-sm">
                                        <p>
                                            <span className="font-bold text-amber-300">
                                                {records.length === 1 ? 'New PR' : `${records.length} new PRs`}
                                            </span>{' '}
                                            · <span className="font-semibold">{exercise}</span>
                                        </p>
                                        <ul className="mt-0.5 text-zinc-400">
                                            {records.map((pr, j) => (
                                                <li key={j} className="truncate">
                                                    {pr.type}: {pr.detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 motion-safe:animate-rise" style={{ animationDelay: '1100ms' }}>
                        <button
                            ref={cta}
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-2xl bg-lime-400 px-6 py-3.5 text-base font-black text-zinc-950 hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime-400/40"
                        >
                            Add photos &amp; share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
            <dt className="text-xs text-zinc-400">{label}</dt>
            <dd className="mt-0.5 text-lg font-extrabold tabular-nums">{value}</dd>
        </div>
    );
}
