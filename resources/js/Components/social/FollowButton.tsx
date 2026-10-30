import { btn } from '@/Components/ui';
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
            className={`${btn.secondary} group min-w-[6.5rem] hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 ${className}`}
        >
            <span className="group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline">Unfollow</span>
        </button>
    ) : (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`${btn.primary} min-w-[6.5rem] ${className}`}
        >
            Follow
        </button>
    );
}
