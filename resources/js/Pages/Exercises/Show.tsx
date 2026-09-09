import { Card, Chip, StatCard } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { EXERCISE_TYPE_LABELS, Exercise } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface HistoryRow {
    date: string;
    max_w: number | string | null;
    vol: number | string | null;
    reps: number | null;
}

interface Props {
    exercise: Exercise;
    history: HistoryRow[];
    prs: { id: number; record_type: string; value_primary: number | string; value_reps: number | null }[];
    bestSet: { weight_kg: number | string; reps: number } | null;
    oneRm: number | null;
}

export default function ExerciseShow({ exercise, history, prs, bestSet, oneRm }: Props) {
    const auth = (usePage().props as unknown as { auth: { user: { id: number; role: string } } }).auth;
    const canEdit = auth.user.role === 'admin' || (!exercise.is_system && exercise.created_by === auth.user.id);
    const data = useMemo(
        () =>
            history.map((h) => ({
                date: new Date(h.date).toLocaleDateString(),
                max: Number(h.max_w ?? 0),
            })),
        [history],
    );

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">{exercise.name}</h1>}>
            <Head title={exercise.name} />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <div className="flex h-40 items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-800">
                            Demonstration media placeholder
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <Chip>{EXERCISE_TYPE_LABELS[exercise.exercise_type] ?? exercise.exercise_type}</Chip>
                            <Chip>{exercise.primary_muscle?.name ?? '—'}</Chip>
                            <Chip>{exercise.equipment?.name ?? '—'}</Chip>
                        </div>
                        {exercise.description && <p className="mt-3 text-sm">{exercise.description}</p>}
                        {exercise.instructions && (
                            <p className="mt-2 whitespace-pre-line text-sm text-zinc-500">{exercise.instructions}</p>
                        )}
                        {canEdit && (
                            <Link
                                href={route('exercises.edit', exercise.id)}
                                className="mt-3 inline-block rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold dark:border-zinc-700"
                            >
                                Edit
                            </Link>
                        )}
                    </Card>

                    <Card>
                        <h2 className="font-bold">History</h2>
                        {history.length === 0 ? (
                            <p className="mt-2 text-sm text-zinc-500">Complete a workout to see your progress.</p>
                        ) : (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="max" stroke="#a3e635" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            label="Best set"
                            value={bestSet ? `${bestSet.weight_kg} × ${bestSet.reps}` : '—'}
                        />
                        <StatCard label="1RM (est.)" value={oneRm ?? '—'} sub="Epley, estimate only" />
                    </div>
                    <Card>
                        <h2 className="font-bold">Personal records</h2>
                        {prs.length === 0 && (
                            <p className="mt-2 text-sm text-zinc-500">No PRs for this exercise yet.</p>
                        )}
                        {prs.map((pr) => (
                            <p key={pr.id} className="mt-2 text-sm">
                                <strong>{pr.record_type}</strong>: {String(pr.value_primary)}
                                {pr.value_reps ? ` × ${pr.value_reps}` : ''}
                            </p>
                        ))}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
