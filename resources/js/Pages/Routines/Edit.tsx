import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { EmptyState } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { api } from '@/lib/api';
import { Exercise, Routine, RoutineExercise, RoutineFolder, RoutineTargetSet } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const SET_TYPES = ['normal', 'warmup', 'drop', 'failure', 'assisted', 'myo_rep'];

interface EditableSet {
    target_weight_kg: string;
    target_reps_min: string;
    target_reps_max: string;
    target_rpe: string;
    set_type: string;
}

interface EditableExercise extends RoutineExercise {
    draft_rest: string;
    draft_notes: string;
    draft_sets: EditableSet[];
    saving: boolean;
    saved: boolean;
}

const toEditable = (re: RoutineExercise): EditableExercise => ({
    ...re,
    draft_rest: String(re.rest_seconds ?? 90),
    draft_notes: re.notes ?? '',
    draft_sets: re.target_sets.map((s: RoutineTargetSet) => ({
        target_weight_kg: s.target_weight_kg?.toString() ?? '',
        target_reps_min: s.target_reps_min?.toString() ?? '',
        target_reps_max: (s.target_reps_max ?? s.target_reps_min)?.toString() ?? '',
        target_rpe: s.target_rpe?.toString() ?? '',
        set_type: s.set_type,
    })),
    saving: false,
    saved: false,
});

const numOrNull = (v: string): number | null => (v === '' ? null : Number(v));

export default function RoutineEdit({
    routine,
    exercises: library,
    folders,
}: {
    routine: Routine;
    exercises: Exercise[];
    folders: RoutineFolder[];
}) {
    const { data, setData, patch, processing } = useForm({
        name: routine.name,
        folder_id: routine.folder_id ? String(routine.folder_id) : '',
        description: routine.description ?? '',
    });

    const [items, setItems] = useState<EditableExercise[]>(() =>
        (routine.exercises ?? []).map(toEditable),
    );
    const [newExerciseId, setNewExerciseId] = useState('');
    const [adding, setAdding] = useState(false);

    const submitMeta = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('routines.update', routine.id));
    };

    const mutateItem = (id: number, fn: (it: EditableExercise) => EditableExercise) =>
        setItems((prev) => prev.map((it) => (it.id === id ? fn(it) : it)));

    const mutateSet = (id: number, idx: number, patchSet: Partial<EditableSet>) =>
        mutateItem(id, (it) => ({
            ...it,
            saved: false,
            draft_sets: it.draft_sets.map((s, i) => (i === idx ? { ...s, ...patchSet } : s)),
        }));

    const addExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExerciseId) return;
        setAdding(true);
        try {
            const { exercise } = await api.addRoutineExercise(routine.id, {
                exercise_id: Number(newExerciseId),
            });
            setItems((prev) => [...prev, toEditable(exercise as unknown as RoutineExercise)]);
            setNewExerciseId('');
        } finally {
            setAdding(false);
        }
    };

    const removeExercise = async (it: EditableExercise) => {
        if (!confirm(`Remove ${it.exercise.name} from this routine?`)) return;
        setItems((prev) => prev.filter((e) => e.id !== it.id));
        await api.deleteRoutineExercise(routine.id, it.id).catch(() => undefined);
    };

    const move = async (index: number, dir: -1 | 1) => {
        const next = [...items];
        const j = index + dir;
        if (j < 0 || j >= next.length) return;
        [next[index], next[j]] = [next[j], next[index]];
        setItems(next);
        await api
            .reorderRoutineExercises(routine.id, next.map((e) => e.id))
            .catch(() => undefined);
    };

    const saveExercise = async (it: EditableExercise) => {
        mutateItem(it.id, (e) => ({ ...e, saving: true, saved: false }));
        try {
            const { exercise } = await api.patchRoutineExercise(routine.id, it.id, {
                rest_seconds: numOrNull(it.draft_rest) ?? 90,
                notes: it.draft_notes || null,
                sets: it.draft_sets.map((s) => ({
                    target_weight_kg: numOrNull(s.target_weight_kg),
                    target_reps_min: numOrNull(s.target_reps_min),
                    target_reps_max: numOrNull(s.target_reps_max),
                    target_rpe: numOrNull(s.target_rpe),
                    set_type: s.set_type,
                })),
            });
            const fresh = toEditable(exercise as unknown as RoutineExercise);
            mutateItem(it.id, () => ({ ...fresh, saved: true }));
        } finally {
            mutateItem(it.id, (e) => ({ ...e, saving: false }));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Edit: {routine.name}</h1>}>
            <Head title={`Edit ${routine.name}`} />

            <form onSubmit={submitMeta} className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                    <InputLabel htmlFor="name" value="Routine name" />
                    <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" required />
                </div>
                <div>
                    <InputLabel htmlFor="folder_id" value="Folder" />
                    <select id="folder_id" value={data.folder_id} onChange={(e) => setData('folder_id', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                        <option value="">Ungrouped</option>
                        {folders.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <InputLabel htmlFor="description" value="Description" />
                    <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </div>
                <PrimaryButton disabled={processing}>Save details</PrimaryButton>
            </form>

            <div className="mt-6 flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Exercises ({items.length})</h2>
                <Link href={route('routines.show', routine.id)} className="text-sm font-semibold text-lime-600 dark:text-lime-400">
                    Back to routine
                </Link>
            </div>

            {items.length === 0 && (
                <div className="mt-3">
                    <EmptyState title="No exercises yet" hint="Add your first exercise below." />
                </div>
            )}

            <div className="mt-3 space-y-4">
                {items.map((it, idx) => (
                    <section key={it.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-bold">
                                {idx + 1}. {it.exercise.name}
                            </p>
                            <div className="flex gap-1 text-xs">
                                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded-lg border border-zinc-300 px-2 py-1 font-bold disabled:opacity-40 dark:border-zinc-700" aria-label="Move up">↑</button>
                                <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="rounded-lg border border-zinc-300 px-2 py-1 font-bold disabled:opacity-40 dark:border-zinc-700" aria-label="Move down">↓</button>
                                <button onClick={() => removeExercise(it)} className="rounded-lg border border-red-300 px-2 py-1 font-bold text-red-500">Remove</button>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                                <label className="text-xs font-semibold" htmlFor={`rest-${it.id}`}>Rest (seconds)</label>
                                <input id={`rest-${it.id}`} type="number" min={0} max={3600} value={it.draft_rest} onChange={(e) => mutateItem(it.id, (x) => ({ ...x, draft_rest: e.target.value, saved: false }))} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold" htmlFor={`notes-${it.id}`}>Notes</label>
                                <input id={`notes-${it.id}`} value={it.draft_notes} onChange={(e) => mutateItem(it.id, (x) => ({ ...x, draft_notes: e.target.value, saved: false }))} placeholder="Cues, tempo, alternatives…" className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                            </div>
                        </div>

                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-sm tabular-nums">
                                <thead className="text-xs text-zinc-500">
                                    <tr>
                                        <th className="py-1 text-left">Set</th>
                                        <th className="text-left">Weight (kg)</th>
                                        <th className="text-left">Reps min</th>
                                        <th className="text-left">Reps max</th>
                                        <th className="text-left">RPE</th>
                                        <th className="text-left">Type</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {it.draft_sets.map((s, i) => (
                                        <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                                            <td className="py-1 font-bold">{i + 1}</td>
                                            <td><input type="number" step="0.5" min={0} value={s.target_weight_kg} onChange={(e) => mutateSet(it.id, i, { target_weight_kg: e.target.value })} className="w-20 rounded-lg border-zinc-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Target weight" /></td>
                                            <td><input type="number" min={0} value={s.target_reps_min} onChange={(e) => mutateSet(it.id, i, { target_reps_min: e.target.value })} className="w-16 rounded-lg border-zinc-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Target reps min" /></td>
                                            <td><input type="number" min={0} value={s.target_reps_max} onChange={(e) => mutateSet(it.id, i, { target_reps_max: e.target.value })} className="w-16 rounded-lg border-zinc-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Target reps max" /></td>
                                            <td><input type="number" step="0.5" min={0} max={10} value={s.target_rpe} onChange={(e) => mutateSet(it.id, i, { target_rpe: e.target.value })} className="w-14 rounded-lg border-zinc-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Target RPE" /></td>
                                            <td>
                                                <select value={s.set_type} onChange={(e) => mutateSet(it.id, i, { set_type: e.target.value })} className="rounded-lg border-zinc-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Set type">
                                                    {SET_TYPES.map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <button onClick={() => mutateItem(it.id, (x) => ({ ...x, saved: false, draft_sets: x.draft_sets.filter((_, j) => j !== i) }))} className="text-xs text-red-500" aria-label="Remove set">✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <button
                                onClick={() => mutateItem(it.id, (x) => ({ ...x, saved: false, draft_sets: [...x.draft_sets, { target_weight_kg: '', target_reps_min: '', target_reps_max: '', target_rpe: '', set_type: 'normal' }] }))}
                                className="rounded-xl border border-zinc-300 px-3 py-1 text-sm font-bold dark:border-zinc-700"
                            >
                                + Add set
                            </button>
                            <button onClick={() => saveExercise(it)} disabled={it.saving} className="rounded-xl bg-lime-400 px-4 py-1 text-sm font-bold text-zinc-950 disabled:opacity-60">
                                {it.saving ? 'Saving…' : it.saved ? 'Saved ✓' : 'Save sets'}
                            </button>
                        </div>
                    </section>
                ))}
            </div>

            <form onSubmit={addExercise} className="mt-4 flex max-w-xl gap-2">
                <select value={newExerciseId} onChange={(e) => setNewExerciseId(e.target.value)} className="block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" required aria-label="Exercise to add">
                    <option value="">Add exercise…</option>
                    {library.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                </select>
                <button disabled={adding} className="whitespace-nowrap rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-950">
                    {adding ? 'Adding…' : 'Add'}
                </button>
            </form>
        </AuthenticatedLayout>
    );
}
