import PersonList from '@/Components/social/PersonList';
import { Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Paginated, PersonRow, PublicProfile } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function FollowList({ profile, kind, people }: { profile: PublicProfile; kind: 'followers' | 'following'; people: Paginated<PersonRow> }) {
    const title = kind === 'followers' ? 'Followers' : 'Following';

    return (
        <AuthenticatedLayout>
            <Head title={`${title} · ${profile.name}`} />
            <div className="mx-auto max-w-2xl">
                <Link href={route('users.show', profile.username)} className="inline-flex min-h-11 items-center text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    ← {profile.name}
                </Link>

                <nav aria-label="Connections" className="mt-4 flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
                    {(['followers', 'following'] as const).map((k) => (
                        <Link
                            key={k}
                            href={route(k === 'followers' ? 'users.followers' : 'users.following', profile.username)}
                            aria-current={kind === k ? 'page' : undefined}
                            className={`-mb-px inline-flex min-h-11 items-center border-b-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-400 ${
                                kind === k ? 'border-lime-400 text-zinc-950 dark:text-white' : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                            }`}
                        >
                            {k === 'followers' ? `${profile.followers_count} Followers` : `${profile.following_count} Following`}
                        </Link>
                    ))}
                </nav>

                <div className="mt-4">
                    {people.data.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                            {kind === 'followers'
                                ? `${profile.is_me ? 'You have' : `${profile.name} has`} no followers yet.`
                                : `${profile.is_me ? "You aren't" : `${profile.name} isn't`} following anyone yet.`}
                        </p>
                    ) : (
                        <PersonList people={people.data} />
                    )}
                    <Pagination links={people.links} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
