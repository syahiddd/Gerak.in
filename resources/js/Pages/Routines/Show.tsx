import { confirmAction } from '@/Components/ConfirmDialog';
import ExerciseMedia from '@/Components/ExerciseMedia';
import { btn, EmptyState } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatNumber, setLabel } from '@/lib/units';
import { Routine } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

export default function RoutineShow({ routine }: { routine: Routine }) {
    const exercises = routine.exercises ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold">{routine.name}</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {exercises.length} exercises{routine.folder ? ` · ${routine.folder.name}` : ''}
                        </p>
                    </div>
                    <Link href={route('workouts.start-routine', routine.id)} method="post" as="button" className={btn.primary}>
                        Start workout
                    </Link>
                </div>
            }
        >
            <Head title={routine.name} />

            {routine.description && <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{routine.description}</p>}

            <div className="space-y-3">
                {exercises.length === 0 && (
                    <EmptyState title="No exercises in this routine" hint="Edit the routine or add exercises when you start a workout." />
                )}
                {exercises.map((re) => (
                    <div key={re.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-start gap-3">
                            <ExerciseMedia exercise={re.exercise} variant="inline" />
                            <div>
                                <p className="font-bold">{re.exercise.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {re.exercise.primary_muscle?.name ?? ''} · rest {re.rest_seconds ?? 90}s
                                </p>
                            </div>
                        </div>
                        <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-sm tabular-nums">
                                <thead className="text-xs text-zinc-500 dark:text-zinc-400">
                                    <tr>
                                        <th className="w-10 py-1 text-left">Set</th>
                                        <th className="text-left">Target</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {re.target_sets.map((ts, i) => (
                                        <tr key={ts.id} className="border-t border-zinc-100 dark:border-zinc-800">
                                            <td className="py-1 font-bold" title={ts.set_type.replace('_', ' ')}>
                                                {setLabel(re.target_sets, i)}
                                            </td>
                                            <td>
                                                {ts.target_weight_kg ? `${formatNumber(ts.target_weight_kg)} kg × ` : ''}
                                                {ts.target_reps_max ?? ts.target_reps_min ?? '-'} reps
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* Start workout (header) is the main action; these manage the routine itself. */}
            <div className="mt-4 flex flex-wrap gap-2">
                <Link href={route('routines.edit', routine.id)} className={btn.secondary}>
                    Edit routine
                </Link>
                <Link href={route('routines.duplicate', routine.id)} method="post" as="button" className={btn.ghost}>
                    Duplicate
                </Link>
                <Link href={route('routines.archive', routine.id)} method="post" as="button" className={btn.ghost}>
                    {routine.status === 'archived' ? 'Unarchive' : 'Archive'}
                </Link>
                <button
                    type="button"
                    className={btn.danger}
                    onClick={async () => {
                        const ok = await confirmAction({ title: `Delete "${routine.name}"?`, body: 'This can’t be undone.', confirmLabel: 'Delete routine' });
                        if (ok) router.delete(route('routines.destroy', routine.id));
                    }}
                >
                    Delete
                </button>
            </div>
        </AuthenticatedLayout>
    );
}
