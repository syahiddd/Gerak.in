import { btn, StatCard } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { User } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Props {
    totalUsers: number;
    activeUsers: number;
    totalWorkouts: number;
    completedWorkouts: number;
    totalExercises: number;
    customExercises: number;
    recentUsers: User[];
}

export default function AdminDashboard({
    totalUsers,
    activeUsers,
    totalWorkouts,
    completedWorkouts,
    totalExercises,
    customExercises,
    recentUsers,
}: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Admin dashboard</h1>}>
            <Head title="Admin" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Total users" value={totalUsers} />
                <StatCard label="Completed workouts" value={completedWorkouts} sub={`of ${totalWorkouts} total`} />
                <StatCard label="Exercises" value={totalExercises} sub={`${customExercises} custom`} />
                <StatCard label="Active users" value={activeUsers} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <Link href={route('admin.users')} className={btn.secondary}>
                    Manage users
                </Link>
                <Link href={route('admin.exercises')} className={btn.secondary}>
                    Manage exercises
                </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="font-bold">Recent registrations</h2>
                {recentUsers.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No one has signed up yet.</p>
                ) : (
                    <ul className="mt-2 space-y-1 text-sm">
                        {recentUsers.map((u) => (
                            <li key={u.id} className="break-all">
                                <span className="font-semibold">{u.name}</span> · {u.email}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
