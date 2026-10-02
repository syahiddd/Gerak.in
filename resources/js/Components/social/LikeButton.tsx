import { router } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LikeButton({ workoutId, liked, count }: { workoutId: number; liked: boolean; count: number }) {
    const [state, setState] = useState({ liked, count });

    useEffect(() => setState({ liked, count }), [liked, count]);

    const toggle = () => {
        const prev = state;
        const next = { liked: !prev.liked, count: prev.count + (prev.liked ? -1 : 1) };
        setState(next);
        // Optimistic: skip reloading the post list so appended pages stay put.
        const opts = { preserveScroll: true, preserveState: true, only: ['auth'], onError: () => setState(prev) };
        if (next.liked) router.post(route('posts.like', workoutId), {}, opts);
        else router.delete(route('posts.unlike', workoutId), opts);
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={state.liked}
            aria-label={state.liked ? 'Unlike workout' : 'Like workout'}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${
                state.liked ? 'text-rose-500' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
            }`}
        >
            <Heart className={`h-5 w-5 transition-transform motion-reduce:transition-none ${state.liked ? 'scale-110 fill-current' : ''}`} />
            <span className="tabular-nums">{state.count}</span>
        </button>
    );
}
