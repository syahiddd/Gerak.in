import ExerciseMedia from '@/Components/ExerciseMedia';
import Avatar from '@/Components/social/Avatar';
import { timeAgo } from '@/Components/social/format';
import LikeButton from '@/Components/social/LikeButton';
import PostPhotos from '@/Components/social/PostPhotos';
import { PostHeader, PostStats } from '@/Components/social/WorkoutPostCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { displayWeight } from '@/lib/units';
import { FeedPost, PageProps, PostComment, PostExercise } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Trophy } from 'lucide-react';
import { FormEvent } from 'react';

export default function Post({ post }: { post: FeedPost }) {
    return (
        <AuthenticatedLayout>
            <Head title={`${post.title} · ${post.user.name}`} />

            <div className="mx-auto max-w-2xl space-y-4">
                <Link href={route('feed.index')} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    ← Feed
                </Link>

                <article className="rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                    <div className="space-y-4 px-5 pt-5 sm:px-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <PostHeader post={post} />
                            </div>
                            {post.is_owner && (
                                <Link
                                    href={route('workouts.save', post.id)}
                                    className="shrink-0 rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                >
                                    Edit post
                                </Link>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold leading-tight">{post.title}</h1>
                            {post.description && <p className="mt-2 whitespace-pre-line text-zinc-600 dark:text-zinc-300">{post.description}</p>}
                        </div>
                        <PostStats post={post} />
                        <PostPhotos photos={post.photos} alt={post.title} />
                    </div>

                    <div className="mt-4 flex items-center border-t border-zinc-100 px-3 py-1.5 dark:border-zinc-800">
                        <LikeButton workoutId={post.id} liked={post.liked_by_me} count={post.likes_count} />
                        <span className="px-3 text-sm text-zinc-500 dark:text-zinc-400">
                            {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
                        </span>
                    </div>
                </article>

                <section aria-label="Exercises" className="space-y-3">
                    {post.exercises.map((pe) => (
                        <ExerciseBlock key={pe.id} pe={pe} />
                    ))}
                </section>

                <Comments post={post} />
            </div>
        </AuthenticatedLayout>
    );
}

function ExerciseBlock({ pe }: { pe: PostExercise }) {
    const unit = usePage<PageProps>().props.auth.user.settings?.unit_system ?? 'metric';
    const sets = pe.set_list ?? [];

    const describe = (s: NonNullable<PostExercise['set_list']>[number]) => {
        const parts: string[] = [];
        if (s.weight_kg !== null && s.weight_kg !== '') {
            const w = displayWeight(s.weight_kg, unit);
            parts.push(`${w.value} ${w.unit}`);
        }
        if (s.reps !== null) parts.push(`${s.reps} reps`);
        if (s.duration_s) parts.push(`${Math.floor(s.duration_s / 60)}:${String(s.duration_s % 60).padStart(2, '0')}`);
        if (s.distance_m) parts.push(`${s.distance_m} m`);
        return parts.join(' × ') || '—';
    };

    return (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="flex items-center gap-3">
                {pe.exercise && <ExerciseMedia exercise={pe.exercise} variant="inline" />}
                <div className="min-w-0 flex-1">
                    {pe.exercise ? (
                        <Link href={route('exercises.show', pe.exercise.slug)} className="font-bold hover:underline">
                            {pe.exercise.name}
                        </Link>
                    ) : (
                        <span className="font-bold">Deleted exercise</span>
                    )}
                </div>
                {(pe.record_types?.length ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">
                        <Trophy className="h-3.5 w-3.5" aria-hidden /> PR
                    </span>
                )}
            </div>

            {sets.length > 0 ? (
                <table className="mt-4 w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            <th className="w-14 pb-2 font-semibold">Set</th>
                            <th className="pb-2 font-semibold">Weight & reps</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sets.map((s, i) => (
                            <tr key={s.id} className="odd:bg-zinc-50 dark:odd:bg-zinc-800/50">
                                <td className="rounded-l-lg py-2 pl-2 font-semibold tabular-nums">
                                    {s.set_type === 'warmup' ? <span className="text-amber-500">W</span> : s.set_type === 'drop' ? <span className="text-sky-500">D</span> : s.set_type === 'failure' ? <span className="text-red-500">F</span> : i + 1}
                                </td>
                                <td className="rounded-r-lg py-2 tabular-nums">{describe(s)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="mt-3 text-sm text-zinc-500">No completed sets.</p>
            )}
        </div>
    );
}

function Comments({ post }: { post: FeedPost }) {
    const me = usePage<PageProps>().props.auth.user;
    const form = useForm({ body: '' });
    const comments = post.comments ?? [];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('posts.comments.store', post.id), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <section id="comments" aria-label="Comments" className="scroll-mt-6 rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <h2 className="font-bold">Comments</h2>

            {comments.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No comments yet. Say something encouraging.</p>
            ) : (
                <ul className="mt-4 space-y-4">
                    {comments.map((c) => (
                        <CommentRow key={c.id} c={c} />
                    ))}
                </ul>
            )}

            <form onSubmit={submit} className="mt-5 flex items-start gap-3">
                <Avatar user={me} size="sm" />
                <div className="flex-1">
                    <label htmlFor="comment-body" className="sr-only">
                        Write a comment
                    </label>
                    <textarea
                        id="comment-body"
                        rows={2}
                        maxLength={1000}
                        value={form.data.body}
                        onChange={(e) => form.setData('body', e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
                        }}
                        placeholder="Write a comment…"
                        className="block w-full resize-y rounded-xl border-zinc-300 text-sm focus:border-lime-400 focus:ring-lime-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    {form.errors.body && <p className="mt-1 text-sm text-red-500">{form.errors.body}</p>}
                    <div className="mt-2 flex justify-end">
                        <button
                            disabled={form.processing || !form.data.body.trim()}
                            className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 disabled:opacity-50"
                        >
                            Post comment
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}

function CommentRow({ c }: { c: PostComment }) {
    const remove = () => {
        if (confirm('Delete this comment?')) {
            router.delete(route('posts.comments.destroy', c.id), { preserveScroll: true });
        }
    };

    return (
        <li className="flex gap-3">
            <Link href={route('users.show', c.user.username)} className="shrink-0">
                <Avatar user={c.user} size="sm" />
            </Link>
            <div className="min-w-0 flex-1">
                <p className="text-sm">
                    <Link href={route('users.show', c.user.username)} className="font-bold hover:underline">
                        {c.user.name}
                    </Link>{' '}
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{timeAgo(c.created_at)}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm text-zinc-700 dark:text-zinc-200">{c.body}</p>
            </div>
            {c.can_delete && (
                <button type="button" onClick={remove} className="self-start text-xs font-semibold text-zinc-400 hover:text-red-500">
                    Delete
                </button>
            )}
        </li>
    );
}
