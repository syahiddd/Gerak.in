import { Card } from '@/Components/ui';
import ExerciseMedia from '@/Components/ExerciseMedia';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useElapsed, useRestTimer } from '@/hooks/workout';
import { api } from '@/lib/api';
import { formatDuration, formatNumber } from '@/lib/units';
import { Exercise, Workout, WorkoutExercise, WorkoutSet } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface PreviousSet {
    weight_kg: number | string | null;
    reps: number | null;
}

interface Props {
    workout: Workout;
    previous: Record<string, PreviousSet[]>;
    library: Exercise[];
}

const SET_TYPE_SHORT: Record<string, string> = {
    normal: 'N',
    warmup: 'W',
    drop: 'D',
    failure: 'F',
    assisted: 'A',
    myo_rep: 'M',
};

export default function WorkoutShow({ workout: initial, previous, library }: Props) {
    const { auth } = usePage().props as unknown as {
        auth: { user: { settings: { default_rest_seconds: number } | null } };
    };
    const defaultRest = auth.user.settings?.default_rest_seconds ?? 90;
    const isActive = initial.status === 'in_progress' || initial.status === 'paused';

    const [exercises, setExercises] = useState<WorkoutExercise[]>(initial.exercises ?? []);
    const elapsed = useElapsed(initial.started_at, initial.paused_seconds_total ?? 0, initial.paused_at ?? null);
    const isPaused = initial.status === 'paused';
    const rest = useRestTimer();
    const notesForm = useForm({ notes: initial.notes ?? '' });
    const addExerciseForm = useForm({ exercise_id: '' });
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Draft backup so a refresh never loses context (server is source of truth).
    useEffect(() => {
        try {
            if (isActive) localStorage.setItem('gerak-active-workout', String(initial.id));
            else localStorage.removeItem('gerak-active-workout');
        } catch {
            /* ignore */
        }
    }, [initial.id, isActive]);

    useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

    const patchSet = (exerciseId: number, setId: number, payload: Record<string, unknown>) => {
        const key = `${setId}:${Object.keys(payload).join(',')}`;
        clearTimeout(timers.current[key]);
        timers.current[key] = setTimeout(() => {
            api.patchSet(setId, payload).catch(() => undefined);
        }, 500);
        setExercises((prev) =>
            prev.map((we) =>
                we.id === exerciseId
                    ? { ...we, sets: we.sets.map((s) => (s.id === setId ? { ...s, ...payload } : s)) }
                    : we,
            ),
        );
    };

    const toggleSet = (we: WorkoutExercise, set: WorkoutSet) => {
        const next = !set.is_completed;
        patchSet(we.id, set.id, { is_completed: next });
        // Immediate visual feedback for the toggle itself.
        setExercises((prev) =>
            prev.map((e) =>
                e.id === we.id
                    ? { ...e, sets: e.sets.map((s) => (s.id === set.id ? { ...s, is_completed: next } : s)) }
                    : e,
            ),
        );
        if (next) rest.start(defaultRest);
    };

    const deleteSet = async (we: WorkoutExercise, set: WorkoutSet) => {
        if (!confirm('Delete set?')) return;
        setExercises((prev) =>
            prev.map((e) => (e.id === we.id ? { ...e, sets: e.sets.filter((s) => s.id !== set.id) } : e)),
        );
        await api.deleteSet(set.id).catch(() => undefined);
    };

    const addSet = async (we: WorkoutExercise) => {
        try {
            const { set } = await api.addSet(initial.id, we.id);
            setExercises((prev) =>
                prev.map((e) => (e.id === we.id ? { ...e, sets: [...e.sets, set as unknown as WorkoutSet] } : e)),
            );
        } catch {
            /* ignore */
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold">{initial.name}</h1>
                        <p className="text-sm text-zinc-500">
                            {new Date(initial.started_at).toLocaleString()}
                            {initial.status === 'completed' && initial.duration_seconds ? (
                                <>
                                    {' '}· {formatDuration(initial.duration_seconds)} · {formatNumber(initial.total_volume_kg)} kg
                                </>
                            ) : (
                                <>
                                    {' '}· <span className="font-semibold text-lime-600 dark:text-lime-400">{initial.status.replace('_', ' ')}</span>
                                    {' '}· <span className="tabular-nums">{elapsed}</span>
                                </>
                            )}
                        </p>
                    </div>
                    {isActive ? (
                        <div className="flex gap-2 text-sm">
                            {isPaused ? (
                                <Link href={route('workouts.resume', initial.id)} method="post" as="button" className="rounded-xl bg-lime-400 px-4 py-2 font-bold text-zinc-950">
                                    Resume
                                </Link>
                            ) : (
                                <Link href={route('workouts.pause', initial.id)} method="post" as="button" className="rounded-xl border border-zinc-300 px-4 py-2 font-bold dark:border-zinc-700">
                                    Pause
                                </Link>
                            )}
                            <Link href={route('workouts.finish', initial.id)} method="post" as="button" className="rounded-xl bg-lime-400 px-4 py-2 font-bold text-zinc-950">
                                Finish
                            </Link>
                            <Link
                                href={route('workouts.cancel', initial.id)}
                                method="post"
                                as="button"
                                className="rounded-xl border border-red-300 px-4 py-2 font-bold text-red-500"
                                onBefore={() => confirm('Cancel this workout?')}
                            >
                                Cancel
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href={route('workouts.destroy', initial.id)}
                            method="delete"
                            as="button"
                            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-500"
                            onBefore={() => confirm('Delete this workout?')}
                        >
                            Delete
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={initial.name} />

            {isActive && (
                <div className="mb-4 rounded-2xl bg-zinc-950 p-4 text-white dark:bg-lime-400 dark:text-zinc-950">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">
                            REST <span className="ms-2 text-lg tabular-nums">{rest.display}</span>
                        </p>
                        <div className="flex gap-2 text-sm">
                            <button onClick={() => rest.start(90)} className="rounded-lg bg-white/20 px-3 py-1 font-bold dark:bg-zinc-950/10">1:30</button>
                            <button onClick={() => rest.start(180)} className="rounded-lg bg-white/20 px-3 py-1 font-bold dark:bg-zinc-950/10">3:00</button>
                            <button onClick={rest.stop} className="rounded-lg bg-white/20 px-3 py-1 font-bold dark:bg-zinc-950/10">Skip</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {exercises.map((we) => (
                    <Card key={we.id}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <ExerciseMedia exercise={we.exercise} variant="inline" />
                                <div>
                                    <Link href={route('exercises.show', we.exercise.slug)} className="font-bold hover:underline">
                                        {we.exercise.name}
                                    </Link>
                                    <p className="text-xs text-zinc-500">{we.exercise.primary_muscle?.name ?? ''}</p>
                                </div>
                            </div>
                            {isActive && (
                                <Link
                                    href={route('workouts.remove-exercise', [initial.id, we.id])}
                                    method="delete"
                                    as="button"
                                    className="text-xs font-semibold text-red-500"
                                    onBefore={() => confirm('Remove exercise?')}
                                >
                                    Remove
                                </Link>
                            )}
                        </div>

                        {(previous[we.id] ?? []).length > 0 && (
                            <p className="mt-2 text-xs text-zinc-500">
                                LAST TIME:{' '}
                                {(previous[we.id] ?? []).map((p, i) => (
                                    <span key={i} className="font-semibold text-zinc-700 dark:text-zinc-300">
                                        {p.weight_kg ? `${p.weight_kg} kg × ${p.reps}` : `${p.reps} reps`}
                                        {i < (previous[we.id] ?? []).length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </p>
                        )}

                        <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-sm tabular-nums">
                                <thead className="text-xs text-zinc-500">
                                    <tr>
                                        <th className="w-10 py-1 text-left">Set</th>
                                        <th className="text-left">Type</th>
                                        <th className="text-left">Weight</th>
                                        <th className="text-left">Reps</th>
                                        <th className="text-left">RPE</th>
                                        <th className="text-left">Done</th>
                                        {isActive && <th />}
                                    </tr>
                                </thead>
                                <tbody>
                                    {we.sets.map((set, i) => (
                                        <tr key={set.id} className="border-t border-zinc-100 dark:border-zinc-800">
                                            <td className="py-1 font-bold">{i + 1}</td>
                                            <td>{SET_TYPE_SHORT[set.set_type] ?? set.set_type}</td>
                                            {isActive ? (
                                                <>
                                                    <td>
                                                        <input type="number" step="0.5" min={0} value={set.weight_kg ?? ''} onChange={(e) => patchSet(we.id, set.id, { weight_kg: e.target.value === '' ? null : e.target.value })} className="w-20 rounded-lg border-zinc-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Weight kg" />
                                                    </td>
                                                    <td>
                                                        <input type="number" min={0} value={set.reps ?? ''} onChange={(e) => patchSet(we.id, set.id, { reps: e.target.value === '' ? null : Number(e.target.value) })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); toggleSet(we, set); } }} className="w-16 rounded-lg border-zinc-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Reps" />
                                                    </td>
                                                    <td>
                                                        <input type="number" step="0.5" min={0} max={10} value={set.rpe ?? ''} onChange={(e) => patchSet(we.id, set.id, { rpe: e.target.value === '' ? null : e.target.value })} className="w-14 rounded-lg border-zinc-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="RPE" />
                                                    </td>
                                                    <td>
                                                        <button onClick={() => toggleSet(we, set)} aria-label="Toggle set complete" className={`rounded-lg px-3 py-1 font-bold ${set.is_completed ? 'bg-lime-400 text-zinc-950' : 'border border-zinc-300 dark:border-zinc-700'}`}>
                                                            {set.is_completed ? '✓' : '○'}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button onClick={() => deleteSet(we, set)} className="text-xs text-red-500" aria-label="Delete set">✕</button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>{set.weight_kg ?? '—'}</td>
                                                    <td>{set.reps ?? '—'}</td>
                                                    <td>{set.rpe ?? '—'}</td>
                                                    <td>{set.is_completed ? '✓' : '—'}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {isActive && (
                            <button onClick={() => addSet(we)} className="mt-2 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold dark:border-zinc-700">
                                + Add set
                            </button>
                        )}

                        {isActive ? (
                            <ExerciseNotesEditor
                                workoutId={initial.id}
                                exercise={we}
                                onSaved={(notes) =>
                                    setExercises((prev) =>
                                        prev.map((e) => (e.id === we.id ? { ...e, notes } : e)),
                                    )
                                }
                            />
                        ) : (
                            we.notes && <p className="mt-2 text-xs text-zinc-500">{we.notes}</p>
                        )}
                    </Card>
                ))}
            </div>

            {isActive && (
                <>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            addExerciseForm.post(route('workouts.add-exercise', initial.id));
                        }}
                        className="mt-4 flex max-w-xl gap-2"
                    >
                        <select value={addExerciseForm.data.exercise_id} onChange={(e) => addExerciseForm.setData('exercise_id', e.target.value)} className="block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" required>
                            <option value="">Add exercise…</option>
                            {library.map((ex) => (
                                <option key={ex.id} value={ex.id}>{ex.name}</option>
                            ))}
                        </select>
                        <button className="whitespace-nowrap rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">
                            Add
                        </button>
                    </form>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            notesForm.patch(route('workouts.update', initial.id));
                        }}
                        className="mt-4 max-w-xl"
                    >
                        <label htmlFor="notes" className="text-sm font-semibold">Workout notes</label>
                        <textarea id="notes" value={notesForm.data.notes} onChange={(e) => notesForm.setData('notes', e.target.value)} rows={2} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                        <button className="mt-2 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold dark:border-zinc-700">
                            Save notes
                        </button>
                    </form>
                </>
            )}

            {!isActive && initial.notes && (
                <Card className="mt-4">
                    <h2 className="text-sm font-bold">Notes</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{initial.notes}</p>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}

function ExerciseNotesEditor({
    workoutId,
    exercise,
    onSaved,
}: {
    workoutId: number;
    exercise: WorkoutExercise;
    onSaved: (notes: string | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState(exercise.notes ?? '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await api.patchWorkoutExercise(workoutId, exercise.id, { notes: notes || null });
            onSaved(notes || null);
            setOpen(false);
        } finally {
            setSaving(false);
        }
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                {exercise.notes ? 'Edit exercise note' : '+ Add exercise note'}
            </button>
        );
    }

    return (
        <div className="mt-2">
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Cues, pain, substitutions…"
                className="block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                aria-label="Exercise notes"
            />
            <div className="mt-1 flex gap-2">
                <button onClick={save} disabled={saving} className="rounded-lg bg-lime-400 px-3 py-1 text-xs font-bold text-zinc-950 disabled:opacity-60">
                    {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setOpen(false); setNotes(exercise.notes ?? ''); }} className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-bold dark:border-zinc-700">
                    Cancel
                </button>
            </div>
        </div>
    );
}
