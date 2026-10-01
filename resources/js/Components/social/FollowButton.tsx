import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/** Optimistic follow toggle. "Following" turns into "Unfollow" on hover so the action is explicit. */
export default function FollowButton({
    username,
    isFollowing,
    reloadOnly = ['auth'],
    className = '',
}: {
    username: string;
    isFollowing: boolean;
    /** Props to refresh afterwards, e.g. ['profile'] to update follower counts. */
    reloadOnly?: string[];
    className?: string;
}) {
    const [following, setFollowing] = useState(isFollowing);
    const [busy, setBusy] = useState(false);

    useEffect(() => setFollowing(isFollowing), [isFollowing]);

    const toggle = () => {
        const next = !following;
        setFollowing(next);
        setBusy(true);
        const opts = {
            preserveScroll: true,
            preserveState: true,
            only: reloadOnly,
            onError: () => setFollowing(!next),
            onFinish: () => setBusy(false),
        };
        if (next) router.post(route('users.follow', username), {}, opts);
        else router.delete(route('users.unfollow', username), opts);
    };

    return following ? (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`group min-w-[6.5rem] rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-700 hover:border-red-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:border-zinc-700 dark:text-zinc-200 ${className}`}
        >
            <span className="group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline">Unfollow</span>
        </button>
    ) : (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`min-w-[6.5rem] rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${className}`}
        >
            Follow
        </button>
    );
}
