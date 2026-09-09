import { useEffect, useState } from 'react';
import { formatDuration } from '@/lib/units';

/**
 * Ticks every second from a server-provided ISO start time, minus paused time.
 * While pausedAt is set the display freezes. Server timestamps stay
 * authoritative on finish.
 */
export function useElapsed(startedAt: string, pausedSecondsTotal = 0, pausedAt: string | null = null): string {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (pausedAt !== null) return; // frozen while paused
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [pausedAt]);

    const end = pausedAt !== null ? new Date(pausedAt).getTime() : now;
    const seconds = Math.max(
        0,
        Math.floor((end - new Date(startedAt).getTime()) / 1000) - pausedSecondsTotal,
    );
    return formatDuration(seconds);
}

/** Frontend-only rest countdown. No backend request per second. */
export function useRestTimer() {
    const [left, setLeft] = useState<number | null>(null);

    useEffect(() => {
        if (left === null || left <= 0) return;
        const t = setTimeout(() => setLeft(left - 1), 1000);
        return () => clearTimeout(t);
    }, [left]);

    const display =
        left === null ? '—' : left <= 0 ? 'GO' : formatDuration(left).slice(3);

    return {
        display,
        running: left !== null && left > 0,
        start: (seconds: number) => setLeft(seconds),
        stop: () => setLeft(null),
    };
}

/** Applies the persisted theme (system|light|dark) to <html>. */
export function applyTheme(theme: 'system' | 'light' | 'dark') {
    const dark =
        theme === 'dark' ||
        (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    try {
        localStorage.setItem('gerak-theme', theme);
    } catch {
        /* ignore */
    }
}
