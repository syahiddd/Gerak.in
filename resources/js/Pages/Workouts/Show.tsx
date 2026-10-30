import { confirmAction } from '@/Components/ConfirmDialog';
import { btn, Card } from '@/Components/ui';
import ExerciseMedia from '@/Components/ExerciseMedia';
import ExercisePicker from '@/Components/ExercisePicker';
import { humanDuration, VISIBILITY_LABEL } from '@/Components/social/format';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useElapsed, useRestTimer } from '@/hooks/workout';
import { api } from '@/lib/api';
import { formatNumber, setLabel } from '@/lib/units';
import { Exercise, ExerciseOption, Workout, WorkoutExercise, WorkoutSet } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PreviousSet {
    weight_kg: number | string | null;
    reps: number | null;
}

interface Props {
    workout: Workout;
    previous: Record<string, PreviousSet[]>;
}

// Buttons on the dark rest-timer bar.
const restBtn =
    'min-h-11 rounded-xl bg-white/15 px-4 text-sm font-bold text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400';

// "77 kg × 8, 76.5 kg × 8". Sets logged without reps are skipped instead of printing "null reps".
const lastTime = (sets: PreviousSet[] = []) =>
    sets
        .filter((p) => p.reps != null)
        .map((p) => (p.weight_kg ? `${formatNumber(p.weight_kg)} kg × ${p.reps}` : `${p.reps} reps`))
        .join(', ');

export default function WorkoutShow({ workout: initial, previous }: Props) {
    const { auth } = usePage().props as unknown as {
        auth: { user: { settings: { default_rest_seconds: number } | null } };
    };
    const defaultRest = auth.user.settings?.default_rest_seconds ?? 90;
    const isActive = initial.status === 'in_progress' || initial.status === 'paused';

    const [exercises, setExercises] = useState<WorkoutExercise[]>(initial.exercises ?? []);
    // Inertia keeps this component mounted across visits, so take the server's list after add/remove;
    // otherwise a removed exercise stays on screen and a second Remove hits a 404.
    useEffect(() => setExercises(initial.exercises ?? []), [initial.exercises]);
    const elapsed = useElapsed(initial.started_at, initial.paused_seconds_total ?? 0, initial.paused_at ?? null);
    const isPaused = initial.status === 'paused';
    const rest = useRestTimer();
    const addExerciseForm = useForm({ exercise_id: '' });
    const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null);
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
        if (!(await confirmAction({ title: 'Delete this set?', confirmLabel: 'Delete set' }))) return;
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
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {initial.status === 'completed' ? (
                                <>
                                    {new Date(initial.started_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    {' '}· Visible to {VISIBILITY_LABEL[initial.visibility ?? 'private']}
                                </>
                            ) : (
                                <>
                                    {new Date(initial.started_at).toLocaleString()}
                                    {' '}· <span className="font-semibold text-lime-700 dark:text-lime-400">{initial.status.replace('_', ' ')}</span>
                                    {' '}· <span className="tabular-nums">{elapsed}</span>
                                </>
                            )}
                        </p>
                    </div>
                    {isActive ? (
                        // While paused, resuming is the main action; otherwise finishing is.
                        <div className="flex flex-wrap items-center gap-2">
                            {isPaused ? (
                                <Link href={route('workouts.resume', initial.id)} method="post" as="button" className={btn.primary}>
                                    Resume
                                </Link>
                            ) : (
                                <Link href={route('workouts.pause', initial.id)} method="post" as="button" className={btn.secondary}>
                                    Pause
                                </Link>
                            )}
                            <Link href={route('workouts.finish', initial.id)} method="post" as="button" className={isPaused ? btn.secondary : btn.primary}>
                                Finish
                            </Link>
                            <button
                                type="button"
                                className={btn.danger}
                                onClick={async () => {
                                    const ok = await confirmAction({
                                        title: 'Cancel this workout?',
                                        body: 'It won’t appear in your history or count toward your stats.',
                                        confirmLabel: 'Cancel workout',
                                    });
                                    if (ok) router.post(route('workouts.cancel', initial.id));
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            {initial.status === 'completed' && (
                                <>
                                    <Link href={route('posts.show', initial.id)} className={btn.primary}>
                                        View post
                                    </Link>
                                    <Link href={route('workouts.save', initial.id)} className={btn.secondary}>
                                        Edit sharing
                                    </Link>
                                </>
                            )}
                            <button
                                type="button"
                                className={btn.danger}
                                onClick={async () => {
                                    const ok = await confirmAction({
                                        title: 'Delete this workout?',
                                        body: 'This can’t be undone.',
                                        confirmLabel: 'Delete workout',
                                    });
                                    if (ok) router.delete(route('workouts.destroy', initial.id));
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={initial.name} />

            {isActive && (
                <div className="mb-4 rounded-2xl bg-zinc-950 p-4 text-white dark:bg-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold">
                            Rest <span className="ms-2 text-lg tabular-nums">{rest.display}</span>
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => rest.start(90)} className={restBtn}>1:30</button>
                            <button onClick={() => rest.start(180)} className={restBtn}>3:00</button>
                            <button onClick={rest.stop} className={restBtn}>Skip</button>
                        </div>
                    </div>
                </div>
            )}

            {!isActive && (
                <dl className="mb-4 flex max-w-3xl flex-wrap gap-x-8 gap-y-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                    {[
                        ['Duration', humanDuration(initial.duration_seconds)],
                        ['Volume', `${formatNumber(initial.total_volume_kg)} kg`],
                        ['Sets', String(exercises.reduce((n, we) => n + we.sets.filter((s) => s.is_completed).length, 0))],
                        ['Exercises', String(exercises.length)],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
                            <dd className="text-lg font-extrabold tabular-nums">{value}</dd>
                        </div>
                    ))}
                </dl>
            )}

            <div className={`space-y-4 ${isActive ? '' : 'max-w-3xl'}`}>
                {exercises.map((we) => (
                    <Card key={we.id}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <ExerciseMedia exercise={we.exercise} variant="inline" />
                                <div>
                                    <Link href={route('exercises.show', we.exercise.slug)} className="font-bold hover:underline">
                                        {we.exercise.name}
                                    </Link>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{we.exercise.primary_muscle?.name ?? ''}</p>
                                </div>
                            </div>
                            {isActive && (
                                <button
                                    type="button"
                                    className={btn.danger}
                                    onClick={async () => {
                                        const ok = await confirmAction({
                                            title: `Remove ${we.exercise.name}?`,
                                            confirmLabel: 'Remove',
                                        });
                                        if (ok) router.delete(route('workouts.remove-exercise', [initial.id, we.id]));
                                    }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {/* Only useful mid-workout; afterwards it would repeat this session's own sets. */}
                        {isActive && lastTime(previous[we.id]) && (
                            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                Last time:{' '}
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lastTime(previous[we.id])}</span>
                            </p>
                        )}

                        {!isActive ? (
                            <CompletedSets sets={we.sets} />
                        ) : (
                        <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-sm tabular-nums [&_td]:pe-1 [&_th]:pe-1">
                                <thead className="text-xs text-zinc-500 dark:text-zinc-400">
                                    <tr>
                                        <th className="w-8 py-1 text-left">Set</th>
                                        <th className="text-left">Weight</th>
                                        <th className="text-left">Reps</th>
                                        <th className="text-left">RPE</th>
                                        <th className="text-left">Done</th>
                                        <th />

                                    </tr>
                                </thead>
                                <tbody>
                                    {we.sets.map((set, i) => (
                                        <tr key={set.id} className="border-t border-zinc-100 dark:border-zinc-800">
                                            <td className="py-1 font-bold" title={set.set_type.replace('_', ' ')}>
                                                {setLabel(we.sets, i)}
                                            </td>
                                                <>
                                                    <td>
                                                        <input type="number" step="0.5" min={0} value={set.weight_kg ?? ''} onChange={(e) => patchSet(we.id, set.id, { weight_kg: e.target.value === '' ? null : e.target.value })} className="h-11 w-14 rounded-xl border-zinc-300 px-2 sm:w-20 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Weight kg" />
                                                    </td>
                                                    <td>
                                                        <input type="number" min={0} value={set.reps ?? ''} onChange={(e) => patchSet(we.id, set.id, { reps: e.target.value === '' ? null : Number(e.target.value) })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); toggleSet(we, set); } }} className="h-11 w-12 rounded-xl border-zinc-300 px-2 sm:w-16 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Reps" />
                                                    </td>
                                                    <td>
                                                        <input type="number" step="0.5" min={0} max={10} value={set.rpe ?? ''} onChange={(e) => patchSet(we.id, set.id, { rpe: e.target.value === '' ? null : e.target.value })} className="h-11 w-11 rounded-xl border-zinc-300 px-2 sm:w-14 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="RPE" />
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => toggleSet(we, set)}
                                                            aria-label={set.is_completed ? 'Mark set not done' : 'Mark set done'}
                                                            aria-pressed={set.is_completed}
                                                            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${set.is_completed ? 'bg-lime-400 text-zinc-950 hover:bg-lime-300' : 'border border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:hover:text-zinc-200'}`}
                                                        >
                                                            <Check className="h-5 w-5" strokeWidth={set.is_completed ? 3 : 2} aria-hidden />
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button onClick={() => deleteSet(we, set)} className={`${btn.icon} hover:text-red-600 dark:hover:text-red-400`} aria-label="Delete set">
                                                            <X className="h-4 w-4" aria-hidden />
                                                        </button>
                                                    </td>
                                                </>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        )}

                        {isActive && (
                            <button onClick={() => addSet(we)} className={`${btn.secondary} mt-3`}>
                                Add set
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
                            we.notes && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{we.notes}</p>
                        )}
                    </Card>
                ))}
            </div>

            {isActive && (
                <>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!selectedExercise) return;
                            addExerciseForm.post(route('workouts.add-exercise', initial.id), {
                                onSuccess: () => {
                                    setSelectedExercise(null);
                                    addExerciseForm.reset();
                                },
                            });
                        }}
                        className="mt-4 flex max-w-xl gap-2"
                    >
                        <ExercisePicker
                            className="min-w-0 flex-1"
                            value={selectedExercise}
                            onChange={(ex) => {
                                setSelectedExercise(ex);
                                addExerciseForm.setData('exercise_id', ex ? String(ex.id) : '');
                            }}
                            placeholder="Add exercise…"
                        />
                        <button
                            disabled={!selectedExercise || addExerciseForm.processing}
                            className={`${btn.secondary} whitespace-nowrap`}
                        >
                            Add
                        </button>
                    </form>

                    {/* Preview the movement before adding it. */}
                    {selectedExercise && (
                        <div className="mt-3 max-w-xl rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                            <ExerciseMedia key={selectedExercise.id} exercise={selectedExercise} variant="hero" />
                            <p className="mt-2 text-sm font-bold">{selectedExercise.name}</p>
                        </div>
                    )}

                </>
            )}

            {!isActive && initial.notes && (
                <Card className="mt-4 max-w-3xl">
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
            <button onClick={() => setOpen(true)} className={`${btn.ghost} mt-3`}>
                {exercise.notes ? 'Edit note' : 'Add note'}
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
            <div className="mt-2 flex gap-2">
                <button onClick={save} disabled={saving} className={btn.secondary}>
                    {saving ? 'Saving…' : 'Save note'}
                </button>
                <button onClick={() => { setOpen(false); setNotes(exercise.notes ?? ''); }} className={btn.ghost}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

/** Read-only sets of a finished workout: "77 kg × 8", RPE only when logged, skipped sets dimmed. */
function CompletedSets({ sets }: { sets: WorkoutSet[] }) {
    return (
        <ol className="mt-3 divide-y divide-zinc-100 text-sm tabular-nums dark:divide-zinc-800">
            {sets.map((set, i) => (
                <li key={set.id} className={`flex items-baseline gap-4 py-2 ${set.is_completed ? '' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    <span className="w-6 font-bold" title={set.set_type.replace('_', ' ')}>
                        {setLabel(sets, i)}
                    </span>
                    <span className="flex-1 font-semibold">
                        {set.weight_kg ? `${formatNumber(set.weight_kg)} kg × ${set.reps ?? '-'}` : `${set.reps ?? '-'} reps`}
                    </span>
                    {set.rpe && <span className="text-zinc-500 dark:text-zinc-400">RPE {formatNumber(set.rpe)}</span>}
                    {!set.is_completed && <span className="text-xs">Not done</span>}
                </li>
            ))}
        </ol>
    );
}
