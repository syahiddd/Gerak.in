import { PersonRow } from '@/types';
import { Link } from '@inertiajs/react';
import Avatar from './Avatar';
import FollowButton from './FollowButton';

export default function PersonList({ people }: { people: PersonRow[] }) {
    return (
        <ul className="divide-y divide-zinc-100 rounded-2xl bg-white ring-1 ring-zinc-200 dark:divide-zinc-800 dark:bg-zinc-900 dark:ring-zinc-800">
            {people.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <Link href={route('users.show', p.username)} className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar user={p} />
                        <div className="min-w-0">
                            <p className="truncate font-bold">{p.name}</p>
                            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                                @{p.username}
                                {p.followers_count !== undefined && ` · ${p.followers_count} ${p.followers_count === 1 ? 'follower' : 'followers'}`}
                            </p>
                        </div>
                    </Link>
                    {p.is_me ? (
                        <span className="text-xs font-semibold text-zinc-400">You</span>
                    ) : (
                        <FollowButton username={p.username} isFollowing={p.is_following} />
                    )}
                </li>
            ))}
        </ul>
    );
}
