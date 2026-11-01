import { confirmAction } from '@/Components/ConfirmDialog';
import { btn } from '@/Components/ui';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Optimistic follow toggle. Unfollowing asks first, since "Following" alone doesn't say
 * that tapping it unfollows (and touch screens never see a hover hint).
 */
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

    const toggle = async () => {
        const next = !following;
        if (!next && !(await confirmAction({ title: `Unfollow @${username}?`, body: 'Their workouts for followers stop showing in your feed. You can follow again any time.', confirmLabel: 'Unfollow', danger: false })))
            return;
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

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`${following ? btn.secondary : btn.primary} min-w-[6.5rem] ${className}`}
        >
            {following ? 'Following' : 'Follow'}
        </button>
    );
}
