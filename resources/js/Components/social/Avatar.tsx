import { PublicUser } from '@/types';

// Muted tones that read on both the zinc dark theme and the light theme.
const TONES = [
    'bg-sky-200 text-sky-900',
    'bg-amber-200 text-amber-900',
    'bg-rose-200 text-rose-900',
    'bg-violet-200 text-violet-900',
    'bg-emerald-200 text-emerald-900',
    'bg-orange-200 text-orange-900',
    'bg-teal-200 text-teal-900',
    'bg-fuchsia-200 text-fuchsia-900',
];

const SIZES = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-20 w-20 text-2xl',
};

export default function Avatar({ user, size = 'md' }: { user: Pick<PublicUser, 'id' | 'name'>; size?: keyof typeof SIZES }) {
    const initials = user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    return (
        <span
            aria-hidden
            className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold ${SIZES[size]} ${TONES[user.id % TONES.length]}`}
        >
            {initials || '?'}
        </span>
    );
}
