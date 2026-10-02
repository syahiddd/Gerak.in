import { WorkoutVisibility } from '@/types';

/** "45min", "1h 5min" — compact like Hevy's post stats. */
export function humanDuration(totalSeconds: number | null | undefined): string {
    if (!totalSeconds) return '—';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.round((totalSeconds % 3600) / 60);
    if (h === 0) return `${Math.max(m, 1)}min`;
    return m ? `${h}h ${m}min` : `${h}h`;
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
];

/** "3 hours ago", "yesterday"; falls back to "just now" under a minute. */
export function timeAgo(iso: string | null): string {
    if (!iso) return '';
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    for (const [unit, secs] of STEPS) {
        if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
    }
    return 'just now';
}

export const VISIBILITY_LABEL: Record<WorkoutVisibility, string> = {
    public: 'Everyone',
    followers: 'Followers',
    private: 'Only you',
};
