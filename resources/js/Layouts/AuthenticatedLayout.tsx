import Dropdown from '@/Components/Dropdown';
import { FlashMessages } from '@/Components/ui';
import { applyTheme } from '@/hooks/workout';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

const NAV = [
    { label: 'Dashboard', href: 'dashboard', match: ['dashboard'] },
    { label: 'Workout', href: 'workouts.index', match: ['workouts.*'] },
    { label: 'Routines', href: 'routines.index', match: ['routines.*'] },
    { label: 'Exercises', href: 'exercises.index', match: ['exercises.*'] },
    { label: 'Statistics', href: 'statistics.index', match: ['statistics.*', 'records.*'] },
];

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage().props as unknown as {
        auth: { user: { name: string; email: string; role: string; settings: { theme: string } | null } };
        flash: { success?: string | null; info?: string | null; pr_events?: { exercise: string; type: string; detail: string }[] | null };
    };
    const user = auth.user;
    const [open, setOpen] = useState(false);

    const isActive = (patterns: string[]) =>
        patterns.some((p) => route().current(p));

    return (
        <div className="min-h-screen bg-zinc-100 pb-20 text-zinc-900 sm:pb-0 dark:bg-zinc-950 dark:text-zinc-100">
            <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center gap-8">
                            <Link href={route('dashboard')} className="flex items-center gap-2">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-lg font-extrabold text-zinc-950">
                                    G
                                </span>
                                <span className="text-lg font-extrabold tracking-tight">
                                    Gerak<span className="text-lime-500">.in</span>
                                </span>
                            </Link>
                            <div className="hidden items-center gap-1 text-sm font-medium sm:flex">
                                {NAV.map((n) => (
                                    <Link
                                        key={n.href}
                                        href={route(n.href)}
                                        className={`rounded-lg px-3 py-2 ${isActive(n.match) ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        {n.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="hidden items-center gap-2 sm:flex">
                            <button
                                onClick={() => {
                                    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                                    applyTheme(next as 'light' | 'dark');
                                }}
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:hover:text-white"
                                aria-label="Toggle theme"
                            >
                                Theme
                            </button>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-800"
                                        >
                                            {user.name}
                                            <svg className="ms-1 h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </span>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                    <Dropdown.Link href={route('settings.edit')}>Settings</Dropdown.Link>
                                    {user.role === 'admin' && (
                                        <Dropdown.Link href={route('admin.dashboard')}>Admin</Dropdown.Link>
                                    )}
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setOpen((v) => !v)}
                                className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                aria-label="Menu"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {open && (
                    <div className="border-t border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800 sm:hidden">
                        {NAV.map((n) => (
                            <Link key={n.href} href={route(n.href)} className="block rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                {n.label}
                            </Link>
                        ))}
                        <Link href={route('profile.edit')} className="block rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">Profile</Link>
                        <Link href={route('settings.edit')} className="block rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">Settings</Link>
                        <Link href={route('logout')} method="post" as="button" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            Log Out
                        </Link>
                    </div>
                )}
            </nav>

            {header && (
                <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <FlashMessages flash={flash} />
                {children}
            </main>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white text-[11px] font-medium sm:hidden dark:border-zinc-800 dark:bg-zinc-900" aria-label="Mobile">
                <div className="grid grid-cols-5">
                    {[
                        { label: 'Home', href: 'dashboard', match: ['dashboard'] },
                        { label: 'Workout', href: 'workouts.index', match: ['workouts.*'] },
                        { label: 'Routines', href: 'routines.index', match: ['routines.*'] },
                        { label: 'Stats', href: 'statistics.index', match: ['statistics.*', 'records.*'] },
                        { label: 'Profile', href: 'profile.edit', match: ['profile.*', 'settings.*'] },
                    ].map((n) => (
                        <Link
                            key={n.label}
                            href={route(n.href)}
                            className={`flex flex-col items-center py-2 ${isActive(n.match) ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500'}`}
                        >
                            {n.label}
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
}
