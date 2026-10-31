import { confirmAction } from '@/Components/ConfirmDialog';
import Dropdown from '@/Components/Dropdown';
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
import { Check, ClipboardList, Flag, MoreVertical, NotebookPen, Pause, Play, Plus, Timer, Trash2, X } from 'lucide-react';
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

// Small rounded actions under an exercise name (rest, note).
const chip =
    'inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-100 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700';

// Number inputs without browser spinners: the column is too narrow for them on a phone.
const setInput =
    'h-11 w-full rounded-xl border-zinc-300 px-1 text-center text-sm font-semibold [appearance:textfield] dark:border-zinc-700 dark:bg-zinc-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

const setGrid = 'grid grid-cols-[2.5rem_minmax(0,1fr)_4rem_4rem_2.75rem] items-center gap-2';

// The API sends decimals as "12.00", which a number input shows as "12,00" in some locales.
const withPlainWeights = (list: WorkoutExercise[] = []) =>
    list.map((we) => ({ ...we, sets: we.sets.map((s) => ({ ...s, weight_kg: s.weight_kg == null ? null : Number(s.weight_kg) })) }));

// 90 -> "1:30", 120 -> "2:00".
const formatRest = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// "77kg × 8" for the Previous column; bodyweight sets show reps only.
const previousLabel = (p?: PreviousSet) =>
    !p || p.reps == null ? '-' : p.weight_kg ? `${formatNumber(p.weight_kg)}kg × ${p.reps}` : `${p.reps} reps`;

export default function WorkoutShow({ workout: initial, previous }: Props) {
    const { auth } = usePage().props as unknown as {
        auth: { user: { settings: { default_rest_seconds: number } | null } };
    };
    const defaultRest = auth.user.settings?.default_rest_seconds ?? 90;
    const isActive = initial.status === 'in_progress' || initial.status === 'paused';

    const [exercises, setExercises] = useState<WorkoutExercise[]>(() => withPlainWeights(initial.exercises));
    // Inertia keeps this component mounted across visits, so take the server's list after add/remove;
    // otherwise a removed exercise stays on screen and a second Remove hits a 404.
    useEffect(() => setExercises(withPlainWeights(initial.exercises)), [initial.exercises]);
    const elapsed = useElapsed(initial.started_at, initial.paused_seconds_total ?? 0, initial.paused_at ?? null);
    const isPaused = initial.status === 'paused';
    const rest = useRestTimer();
    const addExerciseForm = useForm({ exercise_id: '' });
    const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null);
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const doneSets = exercises.reduce((n, we) => n + we.sets.filter((s) => s.is_completed).length, 0);
    // Same rule as the server total: only completed sets count.
    const liveVolume = exercises.reduce(
        (sum, we) => sum + we.sets.reduce((s, set) => (set.is_completed ? s + Number(set.weight_kg ?? 0) * (set.reps ?? 0) : s), 0),
        0,
    );

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
                                    <Play className="h-4 w-4" aria-hidden />
                                    Resume
                                </Link>
                            ) : (
                                <Link href={route('workouts.pause', initial.id)} method="post" as="button" className={btn.secondary}>
                                    <Pause className="h-4 w-4" aria-hidden />
                                    Pause
                                </Link>
                            )}
                            <Link href={route('workouts.finish', initial.id)} method="post" as="button" className={isPaused ? btn.secondary : btn.primary}>
                                <Flag className="h-4 w-4" aria-hidden />
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
                                <X className="h-4 w-4" aria-hidden />
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

            {/* Only while counting down, so it doesn't sit on screen as an empty "Rest -" bar. */}
            {isActive && rest.display !== '-' && (
                <div className="sticky top-0 z-30 mb-4 rounded-2xl bg-zinc-950 p-4 text-white dark:bg-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-bold">
                            <Timer className="h-5 w-5 text-lime-400" aria-hidden />
                            Rest <span className="text-lg tabular-nums">{rest.display}</span>
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => rest.start(90)} className={restBtn}>1:30</button>
                            <button onClick={() => rest.start(180)} className={restBtn}>3:00</button>
                            <button onClick={rest.stop} className={restBtn}>Skip</button>
                        </div>
                    </div>
                </div>
            )}

            <dl className="mb-4 flex max-w-3xl flex-wrap gap-x-8 gap-y-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                {[
                    ['Duration', isActive ? elapsed : humanDuration(initial.duration_seconds)],
                    ['Volume', `${formatNumber(isActive ? liveVolume : initial.total_volume_kg)} kg`],
                    ['Sets', String(doneSets)],
                    ...(isActive ? [] : [['Exercises', String(exercises.length)]]),
                ].map(([label, value], i) => (
                    <div key={label}>
                        <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
                        {/* The running clock is the one number that changes on its own, so it gets the accent. */}
                        <dd className={`text-lg font-extrabold tabular-nums ${isActive && i === 0 ? 'text-lime-700 dark:text-lime-400' : ''}`}>{value}</dd>
                    </div>
                ))}
            </dl>

            <div className="max-w-3xl space-y-4">
                {exercises.map((we) => (
                    <Card key={we.id}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <ExerciseMedia exercise={we.exercise} variant="inline" />
                                <div className="min-w-0">
                                    <Link
                                        href={route('exercises.show', we.exercise.slug)}
                                        className="block truncate font-bold text-lime-700 hover:underline dark:text-lime-400"
                                    >
                                        {we.exercise.name}
                                    </Link>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{we.exercise.primary_muscle?.name ?? ''}</p>
                                </div>
                            </div>
                            {isActive && (
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button type="button" className={btn.icon} aria-label={`Options for ${we.exercise.name}`}>
                                            <MoreVertical className="h-5 w-5" aria-hidden />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content contentClasses="py-1 bg-white dark:bg-zinc-800">
                                        <button
                                            type="button"
                                            className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                            onClick={async () => {
                                                const ok = await confirmAction({
                                                    title: `Remove ${we.exercise.name}?`,
                                                    confirmLabel: 'Remove',
                                                });
                                                if (ok) router.delete(route('workouts.remove-exercise', [initial.id, we.id]));
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" aria-hidden />
                                            Remove exercise
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            )}
                        </div>

                        {!isActive ? (
                            <>
                                <CompletedSets sets={we.sets} />
                                {we.notes && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{we.notes}</p>}
                            </>
                        ) : (
                            <>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => rest.start(defaultRest)} className={chip}>
                                        <Timer className="h-4 w-4" aria-hidden />
                                        Rest: {formatRest(defaultRest)}
                                    </button>
                                    <ExerciseNotesEditor
                                        workoutId={initial.id}
                                        exercise={we}
                                        onSaved={(notes) =>
                                            setExercises((prev) => prev.map((e) => (e.id === we.id ? { ...e, notes } : e)))
                                        }
                                    />
                                </div>

                                <div className={`${setGrid} mt-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400`}>
                                    <span className="text-center">Set</span>
                                    <span>Previous</span>
                                    <span className="text-center">kg</span>
                                    <span className="text-center">Reps</span>
                                    <Check className="mx-auto h-4 w-4" aria-label="Done" />
                                </div>

                                <ul className="mt-1 space-y-1 tabular-nums">
                                    {we.sets.map((set, i) => (
                                        <li
                                            key={set.id}
                                            className={`${setGrid} -mx-2 rounded-xl px-2 py-1 transition-colors ${set.is_completed ? 'bg-lime-400/15' : ''}`}
                                        >
                                            {/* Tapping the set number opens its menu, which keeps a delete button out of every row. */}
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button
                                                        type="button"
                                                        title={set.set_type.replace('_', ' ')}
                                                        aria-label={`Set ${setLabel(we.sets, i)} options`}
                                                        className={`flex h-11 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:bg-zinc-800 ${set.set_type === 'warmup' ? 'text-amber-600 dark:text-amber-400' : ''}`}
                                                    >
                                                        {setLabel(we.sets, i)}
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content align="left" contentClasses="py-1 bg-white dark:bg-zinc-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteSet(we, set)}
                                                        className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                                    >
                                                        <Trash2 className="h-4 w-4" aria-hidden />
                                                        Delete set
                                                    </button>
                                                </Dropdown.Content>
                                            </Dropdown>
                                            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{previousLabel(previous[we.id]?.[i])}</span>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                step="0.5"
                                                min={0}
                                                value={set.weight_kg ?? ''}
                                                onChange={(e) => patchSet(we.id, set.id, { weight_kg: e.target.value === '' ? null : e.target.value })}
                                                className={setInput}
                                                aria-label={`Set ${setLabel(we.sets, i)} weight in kg`}
                                            />
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min={0}
                                                value={set.reps ?? ''}
                                                onChange={(e) => patchSet(we.id, set.id, { reps: e.target.value === '' ? null : Number(e.target.value) })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        toggleSet(we, set);
                                                    }
                                                }}
                                                className={setInput}
                                                aria-label={`Set ${setLabel(we.sets, i)} reps`}
                                            />
                                            <button
                                                onClick={() => toggleSet(we, set)}
                                                aria-label={set.is_completed ? 'Mark set not done' : 'Mark set done'}
                                                aria-pressed={set.is_completed}
                                                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${set.is_completed ? 'bg-lime-400 text-zinc-950 hover:bg-lime-300' : 'bg-zinc-100 text-zinc-400 hover:text-zinc-700 dark:bg-zinc-800 dark:hover:text-zinc-200'}`}
                                            >
                                                <Check className="h-5 w-5" strokeWidth={set.is_completed ? 3 : 2} aria-hidden />
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => addSet(we)}
                                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-bold hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                                >
                                    <Plus className="h-4 w-4" aria-hidden />
                                    Add set
                                </button>
                            </>
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

    // Lives in the chip row: the chip stays inline, the note text and editor wrap onto their own line.
    if (!open) {
        return (
            <>
                <button onClick={() => setOpen(true)} className={chip}>
                    <NotebookPen className="h-4 w-4" aria-hidden />
                    {exercise.notes ? 'Edit note' : 'Note'}
                </button>
                {exercise.notes && (
                    <p className="flex basis-full items-start gap-2 pt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                        {exercise.notes}
                    </p>
                )}
            </>
        );
    }

    return (
        <div className="basis-full">
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

/** Read-only sets of a finished workout: "77 kg × 8", skipped sets dimmed. */
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
                    {!set.is_completed && <span className="text-xs">Not done</span>}
                </li>
            ))}
        </ol>
    );
}
