import Avatar from '@/Components/social/Avatar';
import FollowButton from '@/Components/social/FollowButton';
import PostList from '@/Components/social/PostList';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CursorPage, FeedPost, PublicProfile } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Profile({ profile, posts }: { profile: PublicProfile; posts: CursorPage<FeedPost> }) {
    return (
        <AuthenticatedLayout>
            <Head title={`${profile.name} (@${profile.username})`} />
            <div className="mx-auto max-w-2xl space-y-6">
                <ProfileHeader profile={profile} />

                <section aria-label="Workouts">
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Workouts</h2>
                    <PostList
                        posts={posts}
                        empty={
                            <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                                {profile.is_me
                                    ? 'Your finished workouts appear here. Choose who can see each one when you save it.'
                                    : `No workouts you can see yet.${profile.is_following ? '' : ' Follow to see workouts shared with followers.'}`}
                            </div>
                        }
                    />
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

export function ProfileHeader({ profile }: { profile: PublicProfile }) {
    const joined = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : null;

    const stats = [
        { label: 'Workouts', value: profile.workouts_count, href: route('users.show', profile.username) },
        { label: 'Followers', value: profile.followers_count, href: route('users.followers', profile.username) },
        { label: 'Following', value: profile.following_count, href: route('users.following', profile.username) },
    ];

    return (
        <header className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="flex flex-wrap items-center gap-5">
                <Avatar user={profile} size="lg" />
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-extrabold">{profile.name}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">@{profile.username}</p>
                </div>
                {profile.is_me ? (
                    <Link
                        href={route('profile.edit')}
                        className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                        Edit profile
                    </Link>
                ) : (
                    <FollowButton username={profile.username} isFollowing={profile.is_following} reloadOnly={['profile', 'posts']} />
                )}
            </div>

            {profile.bio && <p className="mt-4 whitespace-pre-line text-[15px] text-zinc-700 dark:text-zinc-200">{profile.bio}</p>}
            {joined && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Joined {joined}</p>}

            <div className="mt-5 grid grid-cols-3 divide-x divide-zinc-200 rounded-xl bg-zinc-50 dark:divide-zinc-800 dark:bg-zinc-950">
                {stats.map((s) => (
                    <Link key={s.label} href={s.href} className="rounded-xl px-3 py-3 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
                        <span className="block text-lg font-extrabold tabular-nums">{s.value}</span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{s.label}</span>
                    </Link>
                ))}
            </div>
        </header>
    );
}
