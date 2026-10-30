import Avatar from '@/Components/social/Avatar';
import PostList from '@/Components/social/PostList';
import { btn } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CursorPage, FeedPost, PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

type Tab = 'following' | 'discover';

export default function Feed({ tab, posts, followingCount }: { tab: Tab; posts: CursorPage<FeedPost>; followingCount: number }) {
    const me = usePage<PageProps>().props.auth.user;

    const tabs: { key: Tab; label: string }[] = [
        { key: 'following', label: 'Following' },
        { key: 'discover', label: 'Discover' },
    ];

    const empty =
        tab === 'following' ? (
            <EmptyFeed
                title={followingCount === 0 ? "You're not following anyone yet" : 'No workouts here yet'}
                body={
                    followingCount === 0
                        ? 'Follow people to see their workouts here. Your own shared workouts show up too.'
                        : 'Workouts from you and the people you follow will appear here once they finish a session.'
                }
                action={
                    <Link href={route('feed.index', { tab: 'discover' })} className={btn.primary}>
                        Browse Discover
                    </Link>
                }
            />
        ) : (
            <EmptyFeed
                title="Nothing public yet"
                body="Public workouts from everyone on Gerak.in show up here. Finish a workout and share it with Everyone to be first."
                action={
                    <Link href={route('workouts.index')} className={btn.primary}>
                        Start a workout
                    </Link>
                }
            />
        );

    return (
        <AuthenticatedLayout>
            <Head title="Feed" />

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,40rem)_20rem] lg:justify-center">
                <div>
                    <div className="flex items-end justify-between gap-4">
                        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Feed</h1>
                    </div>

                    <nav aria-label="Feed" className="mt-5 inline-flex rounded-xl bg-zinc-200/70 p-1 dark:bg-zinc-900">
                        {tabs.map((t) => (
                            <Link
                                key={t.key}
                                href={route('feed.index', t.key === 'discover' ? { tab: 'discover' } : {})}
                                preserveScroll={false}
                                aria-current={tab === t.key ? 'page' : undefined}
                                className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
                                    tab === t.key
                                        ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                }`}
                            >
                                {t.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-5">
                        {/* key resets the appended list when switching tabs */}
                        <PostList key={tab} posts={posts} empty={empty} />
                    </div>
                </div>

                <aside className="space-y-4 lg:sticky lg:top-6">
                    <Link
                        href={route('users.show', me.username)}
                        className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200 hover:ring-lime-400 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-lime-400/60"
                    >
                        <Avatar user={me} />
                        <div className="min-w-0">
                            <p className="truncate font-bold">{me.name}</p>
                            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">View your profile</p>
                        </div>
                    </Link>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}

function EmptyFeed({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
            <p className="font-bold">{title}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{body}</p>
            <div className="mt-5">{action}</div>
        </div>
    );
}
