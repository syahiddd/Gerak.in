import { btn, Card, EmptyState, MuscleBars, StatCard } from '@/Components/ui';
import VolumeChart from '@/Components/VolumeChart';
import WorkoutRow from '@/Components/WorkoutRow';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatNumber } from '@/lib/units';
import { ProfileHeader } from '@/Pages/Social/Profile';
import { PageProps, PersonalRecord, PublicProfile, Routine, Workout } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { LogOut, Play, Plus, Settings, ShieldCheck } from 'lucide-react';

interface Props extends PageProps {
    profile: PublicProfile;
    overview: {
        total_workouts: number;
        total_volume_kg: number | string;
        total_sets: number;
        current_streak_days: number;
        pr_count: number;
    };  
    weekly: { labels: string[]; volumes: number[]; counts: number[] };
    muscles: { labels: string[]; sets: number[] };
    recentWorkouts: Workout[];
    activeWorkout: Workout | null;
    routines: Routine[];
    recentPrs: (PersonalRecord & { exercise: { name: string } })[];
    greeting: string;
}

export default function ProfileShow({
    auth,
    profile,
    overview,
    weekly,
    muscles,
    recentWorkouts,
    activeWorkout,
    routines,
    recentPrs,
    greeting,
}: Props) {
    const startEmpty = useForm({});
    const linkCls = 'text-sm font-semibold text-lime-700 hover:underline dark:text-lime-400';

    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            {/* Settings / admin / log out live here now that the mobile drawer is gone. */}
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">Profile</h1>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {auth.user.role === 'admin' && (
                        <Link href={route('admin.dashboard')} className={btn.icon} aria-label="Admin" title="Admin">
                            <ShieldCheck className="h-5 w-5" />
                        </Link>
                    )}
                    <Link href={route('settings.edit')} className={btn.icon} aria-label="Settings" title="Settings">
                        <Settings className="h-5 w-5" />
                    </Link>
                    <Link href={route('logout')} method="post" as="button" className={btn.icon} aria-label="Log out" title="Log out">
                        <LogOut className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            <div className="mb-4">
                <ProfileHeader profile={profile} as="h2" />
            </div>

            {activeWorkout && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lime-400 bg-white p-4 dark:bg-zinc-900">
                    <div>
                        <p className="font-extrabold">Workout in progress: {activeWorkout.name}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Started {new Date(activeWorkout.started_at).toLocaleString()}</p>
                    </div>
                    <Link href={route('workouts.show', activeWorkout.id)} className={btn.primary}>
                        <Play className="h-4 w-4" aria-hidden />
                        Resume
                    </Link>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <h2 className="font-bold">Today's workout</h2>
                        {routines.length > 0 ? (
                            <>
                                <p className="mt-2 text-lg font-extrabold">{routines[0].name}</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{routines[0].exercises_count} exercises</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {/* A running workout's Resume above is the main action when there is one. */}
                                    <Link
                                        href={route('workouts.start-routine', routines[0].id)}
                                        method="post"
                                        as="button"
                                        className={activeWorkout ? btn.secondary : btn.primary}
                                    >
                                        Start workout
                                    </Link>
                                    <Link href={route('routines.show', routines[0].id)} className={btn.secondary}>
                                        View routine
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="mt-3">
                                <EmptyState
                                    title="No routines yet"
                                    hint="Create your first routine to get going."
                                    action={
                                        <Link href={route('routines.create')} className={btn.primary}>
                                            Create routine
                                        </Link>
                                    }
                                />
                            </div>
                        )}
                        {/* Shortcuts: quieter than the routine buttons so they don't compete. */}
                        <div className="-mx-2 mt-4 flex flex-wrap gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                            <button onClick={() => startEmpty.post(route('workouts.start-empty'))} className={`${btn.ghost} px-2`}>
                                <Plus className="h-4 w-4" aria-hidden />
                                Start empty workout
                            </button>
                            <Link href={route('exercises.index')} className={`${btn.ghost} px-2`}>
                                Browse exercises
                            </Link>
                            <Link href={route('measurements.index')} className={`${btn.ghost} px-2`}>
                                Log measurement
                            </Link>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold">Recent workouts</h2>
                            <Link href={route('workouts.index')} className={linkCls}>
                                History
                            </Link>
                        </div>
                        {recentWorkouts.length === 0 && (
                            <div className="mt-3">
                                <EmptyState title="No workouts yet" hint="Your completed workouts will appear here." />
                            </div>
                        )}
                        {recentWorkouts.length > 0 && (
                            <ul className="-mx-5 mt-3 divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                                {recentWorkouts.map((w) => (
                                    <li key={w.id}>
                                        <WorkoutRow workout={w} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold">Volume lifted per week (kg)</h2>
                            <Link href={route('statistics.index')} className={linkCls}>
                                All statistics
                            </Link>
                        </div>
                        <VolumeChart labels={weekly.labels} volumes={weekly.volumes} period="week" className="mt-2 h-48" />
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Workouts" value={overview.total_workouts} />
                        <StatCard label="Volume" value={`${formatNumber(overview.total_volume_kg)} kg`} />
                        <StatCard label="Sets" value={overview.total_sets} />
                        <StatCard label="Streak" value={`${overview.current_streak_days}d`} />
                    </div>

                    <Card>
                        <h2 className="font-bold">Sets per muscle, last 30 days</h2>
                        {muscles.labels.length === 0 ? (
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Complete a workout to see your muscle split.</p>
                        ) : (
                            <MuscleBars labels={muscles.labels} sets={muscles.sets} />
                        )}
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold">Recent PRs</h2>
                            <Link href={route('records.index')} className={linkCls}>
                                All
                            </Link>
                        </div>
                        {recentPrs.length === 0 && (
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No PRs yet. Finish a workout to set one.</p>
                        )}
                        {recentPrs.map((pr) => (
                            <div key={pr.id} className="mt-2 text-sm">
                                <p className="font-bold">{pr.exercise.name}</p>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    {pr.record_type_label}: {formatNumber(pr.value_primary)}
                                    {pr.value_reps ? ` × ${pr.value_reps}` : ''}
                                </p>
                            </div>
                        ))}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
