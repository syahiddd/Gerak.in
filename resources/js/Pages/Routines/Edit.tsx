import { confirmAction } from '@/Components/ConfirmDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Announce, btn, EmptyState } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { api } from '@/lib/api';
import { kgToUnit, UnitSystem, unitToKg, useUnitSystem, weightUnit } from '@/lib/units';
import ExercisePicker from '@/Components/ExercisePicker';
import { ExerciseOption, Routine, RoutineExercise, RoutineFolder, RoutineTargetSet } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const SET_TYPES = ['normal', 'warmup', 'drop', 'failure', 'assisted', 'myo_rep'];

// Phone: set # + 4 numbers on one line (type/remove wrap below). sm+: one line with a Type column.
const SET_GRID = 'grid grid-cols-[1.5rem_repeat(4,minmax(0,1fr))] items-center gap-1.5 sm:grid-cols-[2rem_repeat(4,minmax(0,1fr))_10rem] sm:gap-2';
const SET_INPUT =
    'w-full min-w-0 rounded-lg border-zinc-500 px-2 py-1 text-base sm:text-sm [appearance:textfield] dark:border-zinc-500 dark:bg-zinc-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400';
const FIELD =
    'mt-1 block w-full rounded-xl border-zinc-500 text-base sm:text-sm dark:border-zinc-500 dark:bg-zinc-800 focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400';

interface EditableSet {
    /** Target weight in the user's unit (kg or lb), as typed. */
    target_weight: string;
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
    /** Edited since the last successful save. */
    dirty: boolean;
    error: string | null;
}

const toEditable = (re: RoutineExercise, system: UnitSystem): EditableExercise => ({
    ...re,
    draft_rest: String(re.rest_seconds ?? 90),
    draft_notes: re.notes ?? '',
    draft_sets: re.target_sets.map((s: RoutineTargetSet) => ({
        target_weight: s.target_weight_kg != null ? String(kgToUnit(s.target_weight_kg, system)) : '',
        target_reps_min: s.target_reps_min?.toString() ?? '',
        target_reps_max: (s.target_reps_max ?? s.target_reps_min)?.toString() ?? '',
        target_rpe: s.target_rpe != null ? String(Number(s.target_rpe)) : '',
        set_type: s.set_type,
    })),
    saving: false,
    saved: false,
    dirty: false,
    error: null,
});

const numOrNull = (v: string): number | null => (v === '' ? null : Number(v));

export default function RoutineEdit({
    routine,
    folders,
}: {
    routine: Routine;
    folders: RoutineFolder[];
}) {
    const system = useUnitSystem();
    const unit = weightUnit(system);
    const { data, setData, patch, processing, errors, isDirty } = useForm({
        name: routine.name,
        folder_id: routine.folder_id ? String(routine.folder_id) : '',
        description: routine.description ?? '',
    });

    const [items, setItems] = useState<EditableExercise[]>(() =>
        (routine.exercises ?? []).map((re) => toEditable(re, system)),
    );
    const [newExercise, setNewExercise] = useState<ExerciseOption | null>(null);
    const [adding, setAdding] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    // Set edits are saved per exercise, so warn before a navigation would drop them.
    const unsaved = isDirty || items.some((it) => it.dirty);
    useEffect(() => {
        if (!unsaved) return;
        const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', onUnload);
        const off = router.on('before', (event) => {
            // Saving the details form is a PATCH; only plain navigation leaves the page.
            if (event.detail.visit.method !== 'get') return;
            if (!window.confirm('You have unsaved changes on this routine. Leave without saving them?')) event.preventDefault();
        });
        return () => {
            window.removeEventListener('beforeunload', onUnload);
            off();
        };
    }, [unsaved]);

    const submitMeta = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('routines.update', routine.id), { preserveScroll: true });
    };

    const mutateItem = (id: number, fn: (it: EditableExercise) => EditableExercise) =>
        setItems((prev) => prev.map((it) => (it.id === id ? fn(it) : it)));

    // Every edit marks the card unsaved.
    const edit = (id: number, fn: (it: EditableExercise) => EditableExercise) =>
        mutateItem(id, (it) => ({ ...fn(it), saved: false, dirty: true }));

    const mutateSet = (id: number, idx: number, patchSet: Partial<EditableSet>) =>
        edit(id, (it) => ({ ...it, draft_sets: it.draft_sets.map((s, i) => (i === idx ? { ...s, ...patchSet } : s)) }));

    const addExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExercise) return;
        setAdding(true);
        setPageError(null);
        try {
            const { exercise } = await api.addRoutineExercise(routine.id, {
                exercise_id: newExercise.id,
            });
            setItems((prev) => [...prev, toEditable(exercise as unknown as RoutineExercise, system)]);
            setNewExercise(null);
        } catch {
            setPageError(`Couldn't add ${newExercise.name}. Check your connection and try again.`);
        } finally {
            setAdding(false);
        }
    };

    const removeExercise = async (it: EditableExercise) => {
        if (!(await confirmAction({ title: `Remove ${it.exercise.name} from this routine?`, body: 'Its target sets are removed too.', confirmLabel: 'Remove exercise' }))) return;
        const before = items;
        setItems((prev) => prev.filter((e) => e.id !== it.id));
        try {
            await api.deleteRoutineExercise(routine.id, it.id);
        } catch {
            setItems(before);
            setPageError(`Couldn't remove ${it.exercise.name}. Check your connection and try again.`);
        }
    };

    const move = async (index: number, dir: -1 | 1) => {
        const before = items;
        const next = [...items];
        const j = index + dir;
        if (j < 0 || j >= next.length) return;
        [next[index], next[j]] = [next[j], next[index]];
        setItems(next);
        try {
            await api.reorderRoutineExercises(routine.id, next.map((e) => e.id));
        } catch {
            setItems(before);
            setPageError("Couldn't change the order. Check your connection and try again.");
        }
    };

    const saveExercise = async (it: EditableExercise) => {
        mutateItem(it.id, (e) => ({ ...e, saving: true, saved: false, error: null }));
        try {
            const { exercise } = await api.patchRoutineExercise(routine.id, it.id, {
                rest_seconds: numOrNull(it.draft_rest) ?? 90,
                notes: it.draft_notes || null,
                sets: it.draft_sets.map((s) => ({
                    target_weight_kg: s.target_weight === '' ? null : unitToKg(s.target_weight, system),
                    target_reps_min: numOrNull(s.target_reps_min),
                    target_reps_max: numOrNull(s.target_reps_max),
                    target_rpe: numOrNull(s.target_rpe),
                    set_type: s.set_type,
                })),
            });
            const fresh = toEditable(exercise as unknown as RoutineExercise, system);
            mutateItem(it.id, () => ({ ...fresh, saved: true }));
            setSavedMessage(`${it.exercise.name} saved`);
        } catch {
            mutateItem(it.id, (e) => ({ ...e, saving: false, error: "Couldn't save these sets. Check the values and your connection, then try again." }));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Edit: {routine.name}</h1>}>
            <Head title={`Edit ${routine.name}`} />
            <Announce text={savedMessage} />

            <form onSubmit={submitMeta} className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                    <InputLabel htmlFor="name" value="Routine name" />
                    <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" required />
                    <InputError htmlFor="name" message={errors.name} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="folder_id" value="Folder" />
                    <select id="folder_id" value={data.folder_id} onChange={(e) => setData('folder_id', e.target.value)} className={FIELD}>
                        <option value="">No folder</option>
                        {folders.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                    <InputError htmlFor="folder_id" message={errors.folder_id} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="description" value="Description (optional)" />
                    <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} className={FIELD} />
                    <InputError htmlFor="description" message={errors.description} className="mt-2" />
                </div>
                <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save details'}</PrimaryButton>
            </form>

            <div className="mt-6 flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Exercises ({items.length})</h2>
                <Link href={route('routines.show', routine.id)} className="text-sm font-semibold text-lime-700 hover:underline dark:text-lime-400">
                    Back to routine
                </Link>
            </div>

            {pageError && (
                <div role="alert" className="mt-3 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                    <p className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                        {pageError}
                    </p>
                    <button type="button" onClick={() => setPageError(null)} className={btn.ghost}>
                        Dismiss
                    </button>
                </div>
            )}

            {items.length === 0 && (
                <div className="mt-3">
                    <EmptyState title="No exercises yet" hint="Add your first exercise below." />
                </div>
            )}

            <div className="mt-3 space-y-4">
                {items.map((it, idx) => (
                    <section key={it.id} aria-label={it.exercise.name} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold">
                                {idx + 1}. {it.exercise.name}
                            </h3>
                            <div className="flex shrink-0 items-center">
                                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className={`${btn.icon} disabled:opacity-30`} aria-label={`Move ${it.exercise.name} up`}>
                                    <ChevronUp className="h-5 w-5" aria-hidden />
                                </button>
                                <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className={`${btn.icon} disabled:opacity-30`} aria-label={`Move ${it.exercise.name} down`}>
                                    <ChevronDown className="h-5 w-5" aria-hidden />
                                </button>
                                <button type="button" onClick={() => removeExercise(it)} className={btn.danger}>Remove</button>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                                <label className="text-xs font-semibold" htmlFor={`rest-${it.id}`}>Rest (seconds)</label>
                                <input id={`rest-${it.id}`} type="number" inputMode="numeric" min={0} max={3600} value={it.draft_rest} onChange={(e) => edit(it.id, (x) => ({ ...x, draft_rest: e.target.value }))} className={FIELD} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold" htmlFor={`notes-${it.id}`}>Notes</label>
                                <input id={`notes-${it.id}`} value={it.draft_notes} onChange={(e) => edit(it.id, (x) => ({ ...x, draft_notes: e.target.value }))} placeholder="Slow on the way down, pause at the bottom" className={FIELD} />
                            </div>
                        </div>

                        {/* Grid instead of a table so sets fit a phone: on narrow screens Type + remove wrap to a second line. */}
                        <div className="mt-3 text-sm tabular-nums">
                            <div className={`${SET_GRID} pb-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400`} aria-hidden>
                                <span>Set</span>
                                <span>
                                    <span className="sm:hidden">{unit}</span>
                                    <span className="hidden sm:inline">Weight ({unit})</span>
                                </span>
                                <span>
                                    <span className="sm:hidden">Min</span>
                                    <span className="hidden sm:inline">Reps min</span>
                                </span>
                                <span>
                                    <span className="sm:hidden">Max</span>
                                    <span className="hidden sm:inline">Reps max</span>
                                </span>
                                <span>RPE</span>
                                <span className="hidden sm:block">Type</span>
                            </div>
                            {it.draft_sets.map((s, i) => (
                                <div key={i} className={`${SET_GRID} border-t border-zinc-100 py-1.5 dark:border-zinc-800`}>
                                    <span className="font-bold">{i + 1}</span>
                                    <input type="number" inputMode="decimal" step="0.5" min={0} value={s.target_weight} onChange={(e) => mutateSet(it.id, i, { target_weight: e.target.value })} className={SET_INPUT} aria-label={`Set ${i + 1} target weight in ${unit}`} />
                                    <input type="number" inputMode="numeric" min={0} value={s.target_reps_min} onChange={(e) => mutateSet(it.id, i, { target_reps_min: e.target.value })} className={SET_INPUT} aria-label={`Set ${i + 1} reps min`} />
                                    <input type="number" inputMode="numeric" min={0} value={s.target_reps_max} onChange={(e) => mutateSet(it.id, i, { target_reps_max: e.target.value })} className={SET_INPUT} aria-label={`Set ${i + 1} reps max`} />
                                    <input type="number" inputMode="decimal" step="0.5" min={0} max={10} value={s.target_rpe} onChange={(e) => mutateSet(it.id, i, { target_rpe: e.target.value })} className={SET_INPUT} aria-label={`Set ${i + 1} RPE`} />
                                    <div className="col-span-4 col-start-2 flex items-center gap-1.5 sm:col-span-1 sm:col-start-auto">
                                        <select value={s.set_type} onChange={(e) => mutateSet(it.id, i, { set_type: e.target.value })} className="min-w-0 flex-1 rounded-lg border-zinc-500 py-1 pl-2 text-base sm:text-sm dark:border-zinc-500 dark:bg-zinc-800 focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400" aria-label={`Set ${i + 1} type`}>
                                            {SET_TYPES.map((t) => (
                                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', '-')}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => edit(it.id, (x) => ({ ...x, draft_sets: x.draft_sets.filter((_, j) => j !== i) }))}
                                            className={`${btn.icon} hover:text-red-600 dark:hover:text-red-400`}
                                            aria-label={`Remove set ${i + 1}`}
                                        >
                                            <X className="h-4 w-4" aria-hidden />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => edit(it.id, (x) => ({ ...x, draft_sets: [...x.draft_sets, { target_weight: '', target_reps_min: '', target_reps_max: '', target_rpe: '', set_type: 'normal' }] }))}
                                className={btn.ghost}
                            >
                                Add set
                            </button>
                            {/* One per exercise, so secondary: a lime button on every card would leave no main action. */}
                            <button type="button" onClick={() => saveExercise(it)} disabled={it.saving} className={btn.secondary}>
                                {it.saving ? 'Saving…' : 'Save changes'}
                            </button>
                            {it.dirty && !it.saving && <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Unsaved changes</span>}
                            {it.saved && !it.dirty && <span className="text-sm font-semibold text-lime-700 dark:text-lime-400">Saved</span>}
                        </div>
                        {it.error && (
                            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {it.error}
                            </p>
                        )}
                    </section>
                ))}
            </div>

            <form onSubmit={addExercise} className="mt-4 flex max-w-xl gap-2">
                <label htmlFor="add-exercise" className="sr-only">
                    Add exercise
                </label>
                <ExercisePicker id="add-exercise" className="min-w-0 flex-1" value={newExercise} onChange={setNewExercise} placeholder="Add exercise…" />
                <button disabled={adding || !newExercise} className={`${btn.secondary} whitespace-nowrap`}>
                    {adding ? 'Adding…' : 'Add'}
                </button>
            </form>
        </AuthenticatedLayout>
    );
}
