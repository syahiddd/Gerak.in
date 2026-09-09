import { StatCard } from '@/Components/ui';
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
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Admin Dashboard</h1>}>
            <Head title="Admin" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Total users" value={totalUsers} />
                <StatCard label="Completed workouts" value={completedWorkouts} sub={`of ${totalWorkouts} total`} />
                <StatCard label="Exercises" value={totalExercises} sub={`${customExercises} custom`} />
                <StatCard label="Active users" value={activeUsers} />
            </div>

            <div className="mt-4 flex gap-2 text-sm">
                <Link href={route('admin.users')} className="rounded-xl border border-zinc-300 px-4 py-2 font-bold dark:border-zinc-700">
                    Manage users
                </Link>
                <Link href={route('admin.exercises')} className="rounded-xl border border-zinc-300 px-4 py-2 font-bold dark:border-zinc-700">
                    Manage exercises
                </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="font-bold">Recent registrations</h2>
                {recentUsers.map((u) => (
                    <p key={u.id} className="mt-1 text-sm">
                        {u.name} · {u.email}
                    </p>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
