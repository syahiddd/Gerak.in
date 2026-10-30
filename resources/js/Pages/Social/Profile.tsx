import Avatar from '@/Components/social/Avatar';
import FollowButton from '@/Components/social/FollowButton';
import { timeAgo } from '@/Components/social/format';
import PostList from '@/Components/social/PostList';
import { btn } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CursorPage, FeedPost, PublicProfile } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Dumbbell } from 'lucide-react';

export default function Profile({ profile, posts }: { profile: PublicProfile; posts: CursorPage<FeedPost> }) {
    return (
        <AuthenticatedLayout>
            <Head title={`${profile.name} (@${profile.username})`} />
            <div className="mx-auto max-w-2xl space-y-6">
                <ProfileHeader profile={profile} />

                <section aria-label="Workouts">
                    <h2 className="mb-3 text-lg font-extrabold">Workouts</h2>
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

export function ProfileHeader({ profile, as: Heading = 'h1' }: { profile: PublicProfile; as?: 'h1' | 'h2' }) {
    const joined = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : null;

    const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;
    const counts = [
        { value: profile.workouts_count, label: plural(profile.workouts_count, 'workout'), href: route('users.show', profile.username) },
        { value: profile.followers_count, label: plural(profile.followers_count, 'follower'), href: route('users.followers', profile.username) },
        { value: profile.following_count, label: 'following', href: route('users.following', profile.username) },
    ];

    // Beside the name on wider screens, full width under the details on phones.
    const action = (className: string) =>
        profile.is_me ? (
            <Link href={route('profile.edit')} className={`${btn.secondary} ${className}`}>
                Edit profile
            </Link>
        ) : (
            <FollowButton username={profile.username} isFollowing={profile.is_following} reloadOnly={['profile', 'posts']} className={className} />
        );

    return (
        <header className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 sm:p-6 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="flex items-center gap-4 sm:gap-5">
                <Avatar user={profile} size="lg" />
                <div className="min-w-0 flex-1">
                    <Heading className="truncate text-2xl font-extrabold">{profile.name}</Heading>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        @{profile.username}
                        {joined && <> · Joined {joined}</>}
                    </p>
                </div>
                {action('hidden shrink-0 sm:inline-flex')}
            </div>

            {profile.bio && <p className="mt-4 whitespace-pre-line text-[15px] text-zinc-700 dark:text-zinc-200">{profile.bio}</p>}

            {/* Counts read as one line of text, not three equal stat boxes. */}
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                {counts.map((c) => (
                    <Link key={c.label} href={c.href} className="hover:text-zinc-900 hover:underline dark:hover:text-white">
                        <span className="font-bold tabular-nums text-zinc-900 dark:text-white">{c.value}</span> {c.label}
                    </Link>
                ))}
            </p>

            {profile.last_workout_at && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <Dumbbell className="h-4 w-4" aria-hidden />
                    Last trained {timeAgo(profile.last_workout_at)}
                </p>
            )}

            {action('mt-4 w-full sm:hidden')}
        </header>
    );
}
