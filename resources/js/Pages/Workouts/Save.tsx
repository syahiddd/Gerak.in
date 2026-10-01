import ExerciseMedia from '@/Components/ExerciseMedia';
import { PostStats } from '@/Components/social/WorkoutPostCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FeedPost, WorkoutVisibility } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Globe, Lock, LucideIcon, Users } from 'lucide-react';
import { FormEvent } from 'react';

const OPTIONS: { value: WorkoutVisibility; label: string; hint: string; Icon: LucideIcon }[] = [
    { value: 'public', label: 'Everyone', hint: 'Shows on your profile and in Discover.', Icon: Globe },
    { value: 'followers', label: 'Followers', hint: 'Only people who follow you see it in their feed.', Icon: Users },
    { value: 'private', label: 'Only you', hint: 'Kept in your history; nobody else sees it.', Icon: Lock },
];

export default function Save({
    workout,
    post,
}: {
    workout: { id: number; name: string; description: string | null; visibility: WorkoutVisibility };
    post: FeedPost;
}) {
    const form = useForm({
        name: workout.name,
        description: workout.description ?? '',
        visibility: workout.visibility,
        from_save: true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.patch(route('workouts.update', workout.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Save workout" />

            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Save workout</h1>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Give it a title, add a note, and choose who sees it.</p>
                </div>

                <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                    <PostStats post={post} />
                    <ul className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                        {post.exercises.map((pe) => (
                            <li key={pe.id} className="flex items-center gap-2 rounded-xl bg-zinc-50 py-1 pl-1 pr-3 text-sm dark:bg-zinc-800/60">
                                {pe.exercise && <ExerciseMedia exercise={pe.exercise} variant="inline" className="!h-8 !w-8" />}
                                <span className="font-semibold tabular-nums">{pe.sets}×</span>
                                <span className="max-w-[12rem] truncate">{pe.exercise?.name}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                    <div>
                        <label htmlFor="title" className="text-sm font-semibold">
                            Title
                        </label>
                        <input
                            id="title"
                            required
                            maxLength={120}
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-xl border-zinc-300 focus:border-lime-400 focus:ring-lime-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                        {form.errors.name && <p className="mt-1 text-sm text-red-500">{form.errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="description" className="text-sm font-semibold">
                            Description <span className="font-normal text-zinc-400">(optional)</span>
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            maxLength={2000}
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder="How did it go? New PR, felt strong, tough day…"
                            className="mt-1 block w-full rounded-xl border-zinc-300 focus:border-lime-400 focus:ring-lime-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                        {form.errors.description && <p className="mt-1 text-sm text-red-500">{form.errors.description}</p>}
                    </div>
                </section>

                <fieldset className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                    <legend className="sr-only">Who can see this workout</legend>
                    <p className="text-sm font-semibold" aria-hidden>
                        Who can see this workout
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {OPTIONS.map(({ value, label, hint, Icon }) => {
                            const checked = form.data.visibility === value;
                            return (
                                <label
                                    key={value}
                                    className={`relative flex cursor-pointer flex-col gap-1 rounded-xl p-4 ring-1 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime-400 ${
                                        checked ? 'bg-lime-400/10 ring-lime-400' : 'ring-zinc-200 hover:bg-zinc-50 dark:ring-zinc-700 dark:hover:bg-zinc-800/60'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value={value}
                                        checked={checked}
                                        onChange={() => form.setData('visibility', value)}
                                        className="sr-only"
                                    />
                                    <Icon className={`h-5 w-5 ${checked ? 'text-lime-500' : 'text-zinc-400'}`} aria-hidden />
                                    <span className="font-bold">{label}</span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
                                </label>
                            );
                        })}
                    </div>
                    {form.errors.visibility && <p className="mt-2 text-sm text-red-500">{form.errors.visibility}</p>}
                </fieldset>

                <div className="flex items-center justify-end gap-3">
                    <Link href={route('workouts.show', workout.id)} className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                        Skip for now
                    </Link>
                    <button disabled={form.processing} className="rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-60">
                        Save workout
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
