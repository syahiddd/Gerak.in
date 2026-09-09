import { EmptyState, Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatNumber } from '@/lib/units';
import { Paginated, PersonalRecord } from '@/types';
import { Head } from '@inertiajs/react';

export default function Records({ records }: { records: Paginated<PersonalRecord> }) {
    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Personal Records</h1>}>
            <Head title="Records" />

            {records.data.length === 0 ? (
                <EmptyState title="No PRs yet" hint="Finish a workout and your records will be detected automatically." />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {records.data.map((pr) => (
                        <div key={pr.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <p className="font-bold">{pr.exercise.name}</p>
                            <p className="text-xs text-zinc-500">{pr.record_type}</p>
                            <p className="mt-1 text-xl font-extrabold tabular-nums">
                                {formatNumber(pr.value_primary)}
                                {pr.value_reps ? ` × ${pr.value_reps}` : ''}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {pr.achieved_at ? new Date(pr.achieved_at).toLocaleDateString() : ''}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            <Pagination links={records.links} />
        </AuthenticatedLayout>
    );
}
