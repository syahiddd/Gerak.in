import { confirmAction } from '@/Components/ConfirmDialog';
import Dropdown from '@/Components/Dropdown';
import InputError from '@/Components/InputError';
import { Announce, btn, Card } from '@/Components/ui';
import ExerciseMedia from '@/Components/ExerciseMedia';
import ExercisePicker from '@/Components/ExercisePicker';
import { humanDuration, VISIBILITY_LABEL } from '@/Components/social/format';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useElapsed, useRestTimer } from '@/hooks/workout';
import { api } from '@/lib/api';
import { formatNumber, formatWeight, kgToUnit, setLabel, UnitSystem, unitToKg, useUnitSystem, weightUnit } from '@/lib/units';
import { ExerciseOption, Workout, WorkoutExercise, WorkoutSet } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Check, ClipboardList, Flag, MoreVertical, NotebookPen, Pause, Play, Plus, Timer, Trash2, X } from 'lucide-react';
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
    'inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-100 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-400 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700';

// Number inputs without browser spinners: the column is too narrow for them on a phone.
const setInput =
    'h-11 w-full rounded-xl border-zinc-500 px-1 text-center text-base sm:text-sm font-semibold [appearance:textfield] dark:border-zinc-500 dark:bg-zinc-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400';

const setGrid = 'grid grid-cols-[2.5rem_minmax(0,1fr)_4rem_4rem_2.75rem] items-center gap-2';

// The API sends decimals as "12.00", which a number input shows as "12,00" in some locales.
const withPlainWeights = (list: WorkoutExercise[] = []) =>
    list.map((we) => ({ ...we, sets: we.sets.map((s) => ({ ...s, weight_kg: s.weight_kg == null ? null : Number(s.weight_kg) })) }));

// 90 -> "1:30", 120 -> "2:00".
const formatRest = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// "77 kg × 8" for the Previous column; bodyweight sets show reps only.
const previousLabel = (system: UnitSystem, p?: PreviousSet) =>
    !p || p.reps == null ? '-' : p.weight_kg ? `${formatWeight(p.weight_kg, system)} × ${p.reps}` : `${p.reps} reps`;

const STATUS_LABEL: Record<string, string> = { in_progress: 'In progress', paused: 'Paused', completed: 'Completed', cancelled: 'Cancelled' };

const dateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

type FailedSave = { setId: number; payload: Record<string, unknown> };

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
    const system = useUnitSystem();
    const unit = weightUnit(system);
    // What the user typed in the weight box, in their unit; state keeps kg.
    const [weightDrafts, setWeightDrafts] = useState<Record<number, string>>({});
    // Autosaves that didn't reach the server, kept so they can be retried.
    const [failed, setFailed] = useState<Record<string, FailedSave>>({});
    const [saveError, setSaveError] = useState<string | null>(null);
    const failedCount = Object.keys(failed).length;
    const failedSetIds = new Set(Object.values(failed).map((f) => f.setId));

    // Vibrate (where supported) when the rest countdown runs out.
    useEffect(() => {
        if (rest.display === 'GO') navigator.vibrate?.(200);
    }, [rest.display]);

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

    const sendSet = (key: string, setId: number, payload: Record<string, unknown>) =>
        api
            .patchSet(setId, payload)
            .then(() =>
                setFailed((f) => {
                    const { [key]: _done, ...rest } = f;
                    return rest;
                }),
            )
            .catch(() => setFailed((f) => ({ ...f, [key]: { setId, payload } })));

    const retryFailed = () => Object.entries(failed).forEach(([key, f]) => sendSet(key, f.setId, f.payload));

    const patchSet = (exerciseId: number, setId: number, payload: Record<string, unknown>) => {
        const key = `${setId}:${Object.keys(payload).join(',')}`;
        clearTimeout(timers.current[key]);
        timers.current[key] = setTimeout(() => sendSet(key, setId, payload), 500);
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
        if (!(await confirmAction({ title: `Delete set ${setLabel(we.sets, we.sets.indexOf(set))}?`, body: 'Its weight and reps are removed from this workout.', confirmLabel: 'Delete set' }))) return;
        const before = exercises;
        setExercises((prev) =>
            prev.map((e) => (e.id === we.id ? { ...e, sets: e.sets.filter((s) => s.id !== set.id) } : e)),
        );
        try {
            await api.deleteSet(set.id);
        } catch {
            setExercises(before);
            setSaveError("Couldn't delete the set. Check your connection and try again.");
        }
    };

    const addSet = async (we: WorkoutExercise) => {
        try {
            const { set } = await api.addSet(initial.id, we.id);
            setExercises((prev) =>
                prev.map((e) => (e.id === we.id ? { ...e, sets: [...e.sets, set as unknown as WorkoutSet] } : e)),
            );
        } catch {
            setSaveError("Couldn't add a set. Check your connection and try again.");
        }
    };

    const finish = async () => {
        if (
            failedCount > 0 &&
            !(await confirmAction({
                title: 'Finish with unsaved sets?',
                body: `${failedCount} ${failedCount === 1 ? 'change hasn’t' : 'changes haven’t'} reached the server and will be lost.`,
                confirmLabel: 'Finish anyway',
            }))
        )
            return;
        router.post(route('workouts.finish', initial.id));
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
                                    {dateTime(initial.started_at)}
                                    {' '}· Visible to {VISIBILITY_LABEL[initial.visibility ?? 'private']}
                                </>
                            ) : (
                                <>
                                    {dateTime(initial.started_at)}
                                    {' '}· <span className="font-semibold text-lime-700 dark:text-lime-400">{STATUS_LABEL[initial.status] ?? initial.status}</span>
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
                            <button type="button" onClick={finish} className={isPaused ? btn.secondary : btn.primary}>
                                <Flag className="h-4 w-4" aria-hidden />
                                Finish
                            </button>
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
                                        title: `Delete "${initial.name}"?`,
                                        body: 'Its sets, photos, likes and comments are removed. This can’t be undone.',
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
                            <button type="button" onClick={() => rest.start(90)} className={restBtn} aria-label="Rest 1 minute 30 seconds">1:30</button>
                            <button type="button" onClick={() => rest.start(180)} className={restBtn} aria-label="Rest 3 minutes">3:00</button>
                            <button type="button" onClick={rest.stop} className={restBtn}>{rest.running ? 'Skip rest' : 'Dismiss'}</button>
                        </div>
                    </div>
                </div>
            )}
            <Announce text={isActive && rest.display === 'GO' ? 'Rest is over. Time for your next set.' : null} />

            {(failedCount > 0 || saveError) && (
                <div role="alert" className="mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                    <p className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                        {failedCount > 0
                            ? `${failedCount} ${failedCount === 1 ? 'change' : 'changes'} not saved. Check your connection, then try again.`
                            : saveError}
                    </p>
                    {failedCount > 0 ? (
                        <button type="button" onClick={retryFailed} className={btn.secondary}>
                            Try again
                        </button>
                    ) : (
                        <button type="button" onClick={() => setSaveError(null)} className={btn.ghost}>
                            Dismiss
                        </button>
                    )}
                </div>
            )}

            <dl className="mb-4 flex max-w-3xl flex-wrap gap-x-8 gap-y-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                {[
                    ['Duration', isActive ? elapsed : humanDuration(initial.duration_seconds)],
                    ['Volume', formatWeight(isActive ? liveVolume : initial.total_volume_kg, system)],
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
                                        title={we.exercise.name}
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
                                    <Dropdown.Content>
                                        <Dropdown.Button
                                            danger
                                            onClick={async () => {
                                                const ok = await confirmAction({
                                                    title: `Remove ${we.exercise.name}?`,
                                                    body: `Its ${we.sets.length} ${we.sets.length === 1 ? 'set is' : 'sets are'} removed from this workout.`,
                                                    confirmLabel: 'Remove exercise',
                                                });
                                                if (ok) router.delete(route('workouts.remove-exercise', [initial.id, we.id]));
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" aria-hidden />
                                            Remove exercise
                                        </Dropdown.Button>
                                    </Dropdown.Content>
                                </Dropdown>
                            )}
                        </div>

                        {!isActive ? (
                            <>
                                <CompletedSets sets={we.sets} system={system} />
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
                                    <span className="text-center">{unit}</span>
                                    <span className="text-center">Reps</span>
                                    <span className="sr-only">Done</span>
                                    <Check className="mx-auto h-4 w-4" aria-hidden />
                                </div>

                                <ul className="mt-1 space-y-1 tabular-nums">
                                    {we.sets.map((set, i) => (
                                        <li
                                            key={set.id}
                                            className={`${setGrid} -mx-2 rounded-xl px-2 py-1 transition-colors ${set.is_completed ? 'bg-lime-400/15' : ''} ${failedSetIds.has(set.id) ? 'ring-2 ring-inset ring-red-500' : ''}`}
                                        >
                                            {/* Tapping the set number opens its menu, which keeps a delete button out of every row. */}
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button
                                                        type="button"
                                                        title={set.set_type.replace('_', ' ')}
                                                        aria-label={`Set ${setLabel(we.sets, i)}, ${set.set_type.replace('_', ' ')}${failedSetIds.has(set.id) ? ', not saved' : ''}: options`}
                                                        className={`flex h-11 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-400 dark:bg-zinc-800 ${set.set_type === 'warmup' ? 'text-amber-600 dark:text-amber-400' : ''}`}
                                                    >
                                                        {setLabel(we.sets, i)}
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content align="left">
                                                    <Dropdown.Button danger onClick={() => deleteSet(we, set)}>
                                                        <Trash2 className="h-4 w-4" aria-hidden />
                                                        Delete set
                                                    </Dropdown.Button>
                                                </Dropdown.Content>
                                            </Dropdown>
                                            <span className="break-words text-xs leading-tight text-zinc-500 dark:text-zinc-400">{previousLabel(system, previous[we.id]?.[i])}</span>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                step="0.5"
                                                min={0}
                                                value={weightDrafts[set.id] ?? kgToUnit(set.weight_kg, system) ?? ''}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setWeightDrafts((d) => ({ ...d, [set.id]: v }));
                                                    patchSet(we.id, set.id, { weight_kg: v === '' ? null : unitToKg(v, system) });
                                                }}
                                                className={setInput}
                                                aria-label={`Set ${setLabel(we.sets, i)} weight in ${unit}`}
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
                                                type="button"
                                                onClick={() => toggleSet(we, set)}
                                                aria-label={`Set ${setLabel(we.sets, i)} done`}
                                                aria-pressed={set.is_completed}
                                                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-400 ${set.is_completed ? 'bg-lime-400 text-zinc-950 hover:bg-lime-300' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                                            >
                                                <Check className="h-5 w-5" strokeWidth={set.is_completed ? 3 : 2} aria-hidden />
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    type="button"
                                    onClick={() => addSet(we)}
                                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-bold hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-400 dark:bg-zinc-800 dark:hover:bg-zinc-700"
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
                        <label htmlFor="add-exercise" className="sr-only">
                            Add exercise
                        </label>
                        <ExercisePicker
                            id="add-exercise"
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
                            {addExerciseForm.processing ? 'Adding…' : 'Add'}
                        </button>
                    </form>
                    <InputError htmlFor="add-exercise" message={addExerciseForm.errors.exercise_id} className="mt-2" />

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
    const [error, setError] = useState<string | null>(null);
    const fieldId = `notes-${exercise.id}`;

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            await api.patchWorkoutExercise(workoutId, exercise.id, { notes: notes || null });
            onSaved(notes || null);
            setOpen(false);
        } catch {
            setError("Couldn't save the note. Check your connection and try again.");
        } finally {
            setSaving(false);
        }
    };

    // Lives in the chip row: the chip stays inline, the note text and editor wrap onto their own line.
    if (!open) {
        return (
            <>
                <button type="button" onClick={() => setOpen(true)} className={chip}>
                    <NotebookPen className="h-4 w-4" aria-hidden />
                    {exercise.notes ? 'Edit note' : 'Note'}
                </button>
                {exercise.notes && (
                    <p className="flex basis-full items-start gap-2 pt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
                        {exercise.notes}
                    </p>
                )}
            </>
        );
    }

    return (
        <div className="basis-full">
            <textarea
                id={fieldId}
                autoFocus
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Cues, pain, substitutions…"
                className="block w-full rounded-xl border-zinc-500 text-base sm:text-sm dark:border-zinc-500 dark:bg-zinc-800 focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400"
                aria-label={`Notes for ${exercise.exercise.name}`}
            />
            <InputError htmlFor={fieldId} message={error ?? undefined} className="mt-2" />
            <div className="mt-2 flex gap-2">
                <button type="button" onClick={save} disabled={saving} className={btn.secondary}>
                    {saving ? 'Saving…' : 'Save note'}
                </button>
                <button type="button" onClick={() => { setOpen(false); setNotes(exercise.notes ?? ''); setError(null); }} className={btn.ghost}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

/** Read-only sets of a finished workout: "77 kg × 8", skipped sets dimmed. */
function CompletedSets({ sets, system }: { sets: WorkoutSet[]; system: UnitSystem }) {
    return (
        <ol className="mt-3 divide-y divide-zinc-100 text-sm tabular-nums dark:divide-zinc-800">
            {sets.map((set, i) => (
                <li key={set.id} className={`flex items-baseline gap-4 py-2 ${set.is_completed ? '' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    <span className="w-6 font-bold" title={set.set_type.replace('_', ' ')} aria-label={`Set ${setLabel(sets, i)}, ${set.set_type.replace('_', ' ')}`}>
                        {setLabel(sets, i)}
                    </span>
                    <span className="flex-1 font-semibold">
                        {set.weight_kg ? `${formatWeight(set.weight_kg, system)} × ${set.reps ?? '-'}` : `${set.reps ?? '-'} reps`}
                    </span>
                    {!set.is_completed && <span className="text-xs">Not done</span>}
                </li>
            ))}
        </ol>
    );
}
