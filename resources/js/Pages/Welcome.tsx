import { Head, Link } from '@inertiajs/react';

export default function Welcome({
    auth,
    canLogin,
    canRegister,
}: {
    auth: { user: { name: string } | null };
    canLogin: boolean;
    canRegister: boolean;
    laravelVersion: string;
    phpVersion: string;
}) {
    return (
        <>
            <Head title="Train with intent" />
            <div className="min-h-screen bg-zinc-950 text-zinc-100">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400 text-xl font-extrabold text-zinc-950">
                            G
                        </span>
                        <span className="text-xl font-extrabold tracking-tight">
                            Gerak<span className="text-lime-400">.in</span>
                        </span>
                    </div>
                    <nav className="flex gap-2 text-sm font-semibold">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="rounded-xl bg-lime-400 px-4 py-2 text-zinc-950">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                {canLogin && (
                                    <Link href={route('login')} className="rounded-xl border border-zinc-700 px-4 py-2">
                                        Log in
                                    </Link>
                                )}
                                {canRegister && (
                                    <Link href={route('register')} className="rounded-xl bg-lime-400 px-4 py-2 text-zinc-950">
                                        Get started
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto max-w-6xl px-4 pb-20 pt-10">
                    <p className="text-sm font-bold uppercase tracking-widest text-lime-400">Workout tracking, done right</p>
                    <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl">
                        Know exactly what to lift today — and prove you're improving.
                    </h1>
                    <p className="mt-4 max-w-xl text-zinc-400">
                        Build reusable routines, log sets in seconds at the gym, and watch personal
                        records, volume, and streaks update automatically.
                    </p>
                    <div className="mt-6 flex gap-3">
                        {canRegister && !auth.user && (
                            <Link href={route('register')} className="rounded-xl bg-lime-400 px-6 py-3 font-bold text-zinc-950">
                                Start training free
                            </Link>
                        )}
                        {auth.user && (
                            <Link href={route('dashboard')} className="rounded-xl bg-lime-400 px-6 py-3 font-bold text-zinc-950">
                                Open dashboard
                            </Link>
                        )}
                    </div>

                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ['Reusable routines', 'Push, pull, legs — template once, train forever.'],
                            ['Fast set logging', 'Weight, reps, RPE in two taps. Rest timer included.'],
                            ['Automatic PRs', 'Heaviest lifts and best sets detected on finish.'],
                            ['Real statistics', 'Volume, frequency, muscle split, and streaks.'],
                        ].map(([title, desc]) => (
                            <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                                <p className="font-bold">{title}</p>
                                <p className="mt-1 text-sm text-zinc-400">{desc}</p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
