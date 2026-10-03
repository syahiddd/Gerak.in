import { useState } from 'react';
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
    xl: 'h-24 w-24 text-3xl',
};

export default function Avatar({
    user,
    size = 'md',
    src,
}: {
    user: Pick<PublicUser, 'id' | 'name' | 'avatar_url'>;
    size?: keyof typeof SIZES;
    /** Override the photo, e.g. a local preview before upload. */
    src?: string | null;
}) {
    const photo = src ?? user.avatar_url ?? null;
    const [broken, setBroken] = useState<string | null>(null);

    const initials = user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    if (photo && broken !== photo) {
        return (
            <img
                src={photo}
                alt=""
                aria-hidden
                loading="lazy"
                onError={() => setBroken(photo)}
                className={`shrink-0 rounded-full bg-zinc-200 object-cover dark:bg-zinc-800 ${SIZES[size]}`}
            />
        );
    }

    return (
        <span
            aria-hidden
            className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold ${SIZES[size]} ${TONES[user.id % TONES.length]}`}
        >
            {initials || '?'}
        </span>
    );
}
