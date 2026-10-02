import ExerciseMedia from '@/Components/ExerciseMedia';
import WorkoutCelebration from '@/Components/social/WorkoutCelebration';
import { PostStats } from '@/Components/social/WorkoutPostCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { compressImage } from '@/lib/image';
import { FeedPost, PageProps, PostPhoto, WorkoutVisibility } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Camera, Globe, Lock, LucideIcon, Users, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';

const OPTIONS: { value: WorkoutVisibility; label: string; hint: string; Icon: LucideIcon }[] = [
    { value: 'public', label: 'Everyone', hint: 'Shows on your profile and in Discover.', Icon: Globe },
    { value: 'followers', label: 'Followers', hint: 'Only people who follow you see it in their feed.', Icon: Users },
    { value: 'private', label: 'Only you', hint: 'Kept in your history; nobody else sees it.', Icon: Lock },
];

export default function Save({
    workout,
    post,
    maxPhotos,
}: {
    workout: { id: number; name: string; description: string | null; visibility: WorkoutVisibility; photos: PostPhoto[] };
    post: FeedPost;
    maxPhotos: number;
}) {
    const celebrate = usePage<PageProps>().props.flash.celebrate;
    const [celebrating, setCelebrating] = useState(!!celebrate);

    const form = useForm<{
        _method: 'patch';
        name: string;
        description: string;
        visibility: WorkoutVisibility;
        from_save: boolean;
        photos: File[];
        remove_photo_ids: number[];
    }>({
        _method: 'patch', // multipart uploads must be POSTed; Laravel reads this as PATCH
        name: workout.name,
        description: workout.description ?? '',
        visibility: workout.visibility,
        from_save: true,
        photos: [],
        remove_photo_ids: [],
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('workouts.update', workout.id), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Save workout" />

            {celebrate && celebrating && <WorkoutCelebration celebrate={celebrate} post={post} onClose={() => setCelebrating(false)} />}

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

                <PhotoPicker
                    existing={workout.photos}
                    max={maxPhotos}
                    added={form.data.photos}
                    removed={form.data.remove_photo_ids}
                    onAdd={(files) => form.setData('photos', [...form.data.photos, ...files])}
                    onRemoveNew={(i) => form.setData('photos', form.data.photos.filter((_, n) => n !== i))}
                    onRemoveExisting={(id) => form.setData('remove_photo_ids', [...form.data.remove_photo_ids, id])}
                    error={form.errors.photos ?? Object.entries(form.errors).find(([k]) => k.startsWith('photos.'))?.[1]}
                />

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

function PhotoPicker({
    existing,
    max,
    added,
    removed,
    onAdd,
    onRemoveNew,
    onRemoveExisting,
    error,
}: {
    existing: PostPhoto[];
    max: number;
    added: File[];
    removed: number[];
    onAdd: (files: File[]) => void;
    onRemoveNew: (index: number) => void;
    onRemoveExisting: (id: number) => void;
    error?: string;
}) {
    const input = useRef<HTMLInputElement>(null);
    const [preparing, setPreparing] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const kept = existing.filter((p) => !removed.includes(p.id));
    const slots = max - kept.length - added.length;

    // Object URLs for the not-yet-uploaded files; revoked when the list changes.
    const previews = useMemo(() => added.map((f) => URL.createObjectURL(f)), [added]);
    useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

    const pick = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        setLocalError(null);
        if (files.length > slots) setLocalError(`You can add ${slots} more ${slots === 1 ? 'photo' : 'photos'}; extra ones were skipped.`);

        setPreparing(true);
        try {
            const ready: File[] = [];
            for (const f of files.slice(0, slots)) {
                if (!f.type.startsWith('image/')) continue;
                try {
                    ready.push(await compressImage(f));
                } catch {
                    setLocalError(`"${f.name}" couldn't be read. Try a JPG or PNG.`);
                }
            }
            if (ready.length) onAdd(ready);
        } finally {
            setPreparing(false);
        }
    };

    const tile = 'relative aspect-square overflow-hidden rounded-xl';
    const removeBtn =
        'absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/70 text-white hover:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400';

    return (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold">Photos</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {kept.length + added.length} / {max}
                </p>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
                {kept.map((p, i) => (
                    <div key={p.id} className={tile}>
                        <img src={p.url} alt={`Workout photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => onRemoveExisting(p.id)} className={removeBtn} aria-label={`Remove photo ${i + 1}`}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
                {previews.map((url, i) => (
                    <div key={url} className={tile}>
                        <img src={url} alt={`New photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => onRemoveNew(i)} className={removeBtn} aria-label={`Remove new photo ${i + 1}`}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
                {slots > 0 && (
                    <button
                        type="button"
                        onClick={() => input.current?.click()}
                        disabled={preparing}
                        className={`${tile} flex flex-col items-center justify-center gap-1 border-2 border-dashed border-zinc-300 text-zinc-500 hover:border-lime-400 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white`}
                    >
                        <Camera className="h-6 w-6" aria-hidden />
                        <span className="text-xs font-semibold">{preparing ? 'Preparing…' : 'Add photo'}</span>
                    </button>
                )}
            </div>
            <input ref={input} type="file" accept="image/*" multiple onChange={pick} className="hidden" />

            {(localError || error) && <p className="mt-2 text-sm text-red-500">{localError ?? error}</p>}
            {!localError && !error && kept.length + added.length === 0 && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Gym selfie, the whiteboard, your PR on the bar — up to {max} photos.</p>
            )}
        </section>
    );
}
