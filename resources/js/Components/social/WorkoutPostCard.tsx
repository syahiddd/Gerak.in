import ExerciseMedia from '@/Components/ExerciseMedia';
import { btn } from '@/Components/ui';
import { displayWeight, formatNumber } from '@/lib/units';
import { FeedPost, PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Globe, Lock, MessageCircle, Share2, Trophy, Users } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';
import Avatar from './Avatar';
import { humanDuration, timeAgo, VISIBILITY_LABEL } from './format';
import LikeButton from './LikeButton';
import PostPhotos from './PostPhotos';

const VISIBILITY_ICON = { public: Globe, followers: Users, private: Lock };

/** Author line: avatar, name, @username, when, who can see it. */
export function PostHeader({ post }: { post: FeedPost }) {
    const VisIcon = VISIBILITY_ICON[post.visibility];

    return (
        <div className="flex items-center gap-3">
            <Link href={route('users.show', post.user.username)} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400">
                <Avatar user={post.user} />
            </Link>
            <div className="min-w-0 flex-1">
                <Link href={route('users.show', post.user.username)} className="block truncate font-bold hover:underline">
                    {post.user.name}
                </Link>
                <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="truncate">@{post.user.username}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={post.ended_at ?? undefined} title={post.ended_at ? new Date(post.ended_at).toLocaleString() : undefined}>
                        {timeAgo(post.ended_at)}
                    </time>
                    <span aria-hidden>·</span>
                    <VisIcon className="h-3.5 w-3.5" aria-label={`Visible to: ${VISIBILITY_LABEL[post.visibility]}`} />
                </p>
            </div>
        </div>
    );
}

/** Time · Volume · Sets · Records, Hevy-style label-over-value row. */
export function PostStats({ post }: { post: FeedPost }) {
    const unit = usePage<PageProps>().props.auth.user.settings?.unit_system ?? 'metric';
    const vol = displayWeight(post.volume_kg, unit);

    const items: { label: string; value: ReactNode }[] = [
        { label: 'Time', value: humanDuration(post.duration_seconds) },
        { label: 'Volume', value: post.volume_kg ? `${formatNumber(vol.value)} ${vol.unit}` : '-' },
        { label: 'Sets', value: post.sets_count },
    ];
    if (post.records_count > 0) {
        items.push({
            label: 'Records',
            value: (
                <span className="inline-flex items-center gap-1 text-amber-500">
                    <Trophy className="h-4 w-4" aria-hidden />
                    {post.records_count}
                </span>
            ),
        });
    }

    return (
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
            {items.map((it) => (
                <div key={it.label}>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">{it.label}</dt>
                    <dd className="font-semibold tabular-nums">{it.value}</dd>
                </div>
            ))}
        </dl>
    );
}

export default function WorkoutPostCard({ post }: { post: FeedPost }) {
    const hidden = post.exercises_total - post.exercises.length;
    const href = route('posts.show', post.id);
    const [comments, setComments] = useState(post.comments_count);

    return (
        <article className="rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="space-y-4 px-5 pb-3 pt-5 sm:px-6">
                <PostHeader post={post} />

                <div>
                    <h2 className="text-lg font-bold leading-snug">
                        <Link href={href} className="hover:underline">
                            {post.title}
                        </Link>
                    </h2>
                    {post.description && <p className="mt-1 whitespace-pre-line text-[15px] text-zinc-600 dark:text-zinc-300">{post.description}</p>}
                </div>

                <PostStats post={post} />

                <PostPhotos photos={post.photos} alt={post.title} />

                {post.exercises.length > 0 && (
                    <ul className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                        {post.exercises.map((pe) => (
                            <li key={pe.id} className="flex items-center gap-3">
                                {pe.exercise && <ExerciseMedia exercise={pe.exercise} variant="inline" />}
                                <div className="min-w-0 text-sm">
                                    <p className="truncate font-semibold">{pe.exercise?.name ?? 'Deleted exercise'}</p>
                                    <p className="tabular-nums text-zinc-500 dark:text-zinc-400">
                                        {pe.sets} {pe.sets === 1 ? 'set' : 'sets'}
                                    </p>
                                </div>
                            </li>
                        ))}
                        {hidden > 0 && (
                            <li>
                                <Link href={href} className="text-sm font-semibold text-lime-700 hover:underline dark:text-lime-400">
                                    See {hidden} more {hidden === 1 ? 'exercise' : 'exercises'}
                                </Link>
                            </li>
                        )}
                    </ul>
                )}
            </div>

            <div className="flex items-center gap-1 border-t border-zinc-100 px-3 py-1.5 dark:border-zinc-800">
                <LikeButton workoutId={post.id} liked={post.liked_by_me} count={post.likes_count} />
                <Link href={`${href}#comments`} className={actionCls} aria-label={`${comments} comments`}>
                    <MessageCircle className="h-5 w-5" />
                    <span className="tabular-nums">{comments}</span>
                </Link>
                {post.visibility === 'public' && <ShareButton url={href} title={post.title} />}
            </div>

            <QuickComment postId={post.id} onPosted={() => setComments((c) => c + 1)} />
        </article>
    );
}

const actionCls =
    'inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white';

/** Native share sheet on phones; copies the link where that isn't available. */
function ShareButton({ url, title }: { url: string; title: string }) {
    const [copied, setCopied] = useState(false);

    const share = async () => {
        if (navigator.share) {
            await navigator.share({ title, url }).catch(() => undefined);
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard is blocked on plain http and by some browsers; let the user copy it by hand.
            window.prompt('Copy this link', url);
        }
    };

    return (
        <button type="button" onClick={share} className={`${actionCls} ms-auto`} aria-label="Share workout">
            <Share2 className="h-5 w-5" aria-hidden />
            {copied && <span role="status">Link copied</span>}
        </button>
    );
}

function QuickComment({ postId, onPosted }: { postId: number; onPosted: () => void }) {
    const me = usePage<PageProps>().props.auth.user;
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        // Only refresh `auth` so the loaded feed pages and scroll position stay put.
        router.post(
            route('posts.comments.store', postId),
            { body },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['auth'],
                onSuccess: () => {
                    setBody('');
                    setError(null);
                    onPosted();
                },
                onError: (errs) => setError(errs.body ?? 'Could not post your comment. Try again.'),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <form onSubmit={submit} className="border-t border-zinc-100 px-5 py-3 sm:px-6 dark:border-zinc-800">
            <div className="flex items-center gap-3">
                <Avatar user={me} size="sm" />
                <label htmlFor={`comment-${postId}`} className="sr-only">
                    Write a comment
                </label>
                <input
                    id={`comment-${postId}`}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={1000}
                    placeholder="Write a comment…"
                    className="h-11 min-w-0 flex-1 rounded-xl border-zinc-200 bg-zinc-50 text-sm focus:border-lime-400 focus:ring-lime-400 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <button type="submit" disabled={busy || !body.trim()} className={`${btn.ghost} px-3`}>
                    {busy ? 'Posting…' : 'Post'}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
    );
}
