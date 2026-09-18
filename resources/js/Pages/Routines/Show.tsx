import { EmptyState } from '@/Components/ui';
import ExerciseMedia from '@/Components/ExerciseMedia';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Routine } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function RoutineShow({ routine }: { routine: Routine }) {
    const exercises = routine.exercises ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold">{routine.name}</h1>
                        <p className="text-sm text-zinc-500">
                            {exercises.length} exercises{routine.folder ? ` · ${routine.folder.name}` : ''}
                        </p>
                    </div>
                    <Link
                        href={route('workouts.start-routine', routine.id)}
                        method="post"
                        as="button"
                        className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950"
                    >
                        Start Workout
                    </Link>
                </div>
            }
        >
            <Head title={routine.name} />

            {routine.description && <p className="mb-4 text-sm text-zinc-500">{routine.description}</p>}

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
                                <p className="text-xs text-zinc-500">
                                    {re.exercise.primary_muscle?.name ?? ''} · rest {re.rest_seconds ?? 90}s
                                </p>
                            </div>
                        </div>
                        <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-sm tabular-nums">
                                <thead className="text-xs text-zinc-500">
                                    <tr>
                                        <th className="py-1 text-left">Set</th>
                                        <th className="text-left">Target</th>
                                        <th className="text-left">Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {re.target_sets.map((ts, i) => (
                                        <tr key={ts.id} className="border-t border-zinc-100 dark:border-zinc-800">
                                            <td className="py-1">{i + 1}</td>
                                            <td>
                                                {ts.target_weight_kg ? `${ts.target_weight_kg} kg × ` : ''}
                                                {ts.target_reps_max ?? ts.target_reps_min ?? '—'} reps
                                            </td>
                                            <td>{ts.set_type}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Link href={route('routines.edit', routine.id)} className="rounded-xl border border-zinc-300 px-4 py-2 font-bold dark:border-zinc-700">
                    Edit
                </Link>
                <Link href={route('routines.duplicate', routine.id)} method="post" as="button" className="rounded-xl border border-zinc-300 px-4 py-2 font-bold dark:border-zinc-700">
                    Duplicate
                </Link>
                <Link href={route('routines.archive', routine.id)} method="post" as="button" className="rounded-xl border border-zinc-300 px-4 py-2 font-bold dark:border-zinc-700">
                    {routine.status === 'archived' ? 'Unarchive' : 'Archive'}
                </Link>
                <Link
                    href={route('routines.destroy', routine.id)}
                    method="delete"
                    as="button"
                    className="rounded-xl border border-red-300 px-4 py-2 font-bold text-red-500"
                    onBefore={() => confirm('Delete this routine?')}
                >
                    Delete
                </Link>
            </div>
        </AuthenticatedLayout>
    );
}
