import BrandLogo from '@/Components/BrandLogo';
import Dropdown from '@/Components/Dropdown';
import UserSearchBox from '@/Components/social/UserSearchBox';
import { FlashMessages } from '@/Components/ui';
import { applyTheme } from '@/hooks/workout';
import { Link, usePage } from '@inertiajs/react';
import { Dialog } from '@headlessui/react';
import {
    BarChart3,
    ClipboardList,
    Dumbbell,
    Library,
    Menu,
    Newspaper,
    ShieldCheck,
    User,
    X,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

// The old dashboard now lives on the Profile page.
const PROFILE_MATCH = ['profile.*', 'settings.*', 'measurements.*'];

// Single source of truth for main navigation (desktop sidebar + mobile drawer).
const NAV = [
    { label: 'Feed', href: 'feed.index', match: ['feed.*', 'posts.*', 'users.*'], Icon: Newspaper },
    { label: 'Workout', href: 'workouts.index', match: ['workouts.*'], Icon: Dumbbell },
    { label: 'Routines', href: 'routines.index', match: ['routines.*'], Icon: ClipboardList },
    { label: 'Exercises', href: 'exercises.index', match: ['exercises.*'], Icon: Library },
    { label: 'Statistics', href: 'statistics.index', match: ['statistics.*', 'records.*'], Icon: BarChart3 },
    { label: 'Profile', href: 'profile.show', match: PROFILE_MATCH, Icon: User },
];

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage().props as unknown as {
        auth: { user: { name: string; username: string; email: string; role: string; settings: { theme: string } | null } };
        flash: { success?: string | null; info?: string | null; pr_events?: { exercise: string; type: string; detail: string }[] | null };
    };
    const user = auth.user;

    const isActive = (patterns: string[]) =>
        patterns.some((p) => route().current(p));

    const toggleTheme = () => {
        const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(next as 'light' | 'dark');
    };

    const [drawerOpen, setDrawerOpen] = useState(false);
    const closeDrawer = () => setDrawerOpen(false);

    const navLinks = (onNavigate: () => void) => (
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm font-medium">
            <UserSearchBox className="mb-3" />

            {NAV.map((n) => {
                const active = isActive(n.match);
                const Icon = n.Icon;
                return (
                    <Link
                        key={n.href}
                        href={route(n.href)}
                        onClick={onNavigate}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                            active
                                ? 'bg-lime-400 font-bold text-zinc-950 dark:bg-lime-400 dark:text-zinc-950'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                        }`}
                    >
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                        {n.label}
                    </Link>
                );
            })}
            {user.role === 'admin' && (
                <Link
                    href={route('admin.dashboard')}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                        route().current('admin.*')
                            ? 'bg-zinc-900 font-bold text-white dark:bg-white dark:text-zinc-900'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                    }`}
                >
                    <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={2} />
                    Admin
                </Link>
            )}
        </nav>
    );

    const logo = (
        <Link href={route('feed.index')} className="flex items-center gap-2">
            <BrandLogo />
        </Link>
    );

    return (
        <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:flex">
            {/* ===== Sidebar Desktop (kiri, fixed) ===== */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white sm:flex dark:border-zinc-800 dark:bg-zinc-900 sm:fixed sm:inset-y-0 sm:z-30">
                <div className="flex h-16 items-center px-5">{logo}</div>

                {navLinks(() => {})}

                <div className="space-y-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
                    <button
                        onClick={toggleTheme}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:hover:text-white"
                    >
                        Toggle Theme
                    </button>
                    <Dropdown>
                        <Dropdown.Trigger>
                            <span className="inline-flex w-full rounded-xl">
                                <button
                                    type="button"
                                    className="inline-flex w-full items-center justify-between rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 focus:outline-none dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                >
                                    <span className="truncate">{user.name}</span>
                                    <svg className="ms-1 h-4 w-4 shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </span>
                        </Dropdown.Trigger>
                        <Dropdown.Content
                            align="top"
                            width="full"
                            contentClasses="py-1 bg-white dark:bg-zinc-800"
                        >
                            <Dropdown.Link href={route('users.show', user.username)}>My public profile</Dropdown.Link>
                            <Dropdown.Link href={route('profile.edit')}>Edit profile</Dropdown.Link>
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
            </aside>

            {/* ===== Topbar Mobile + hamburger ===== */}
            <div className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:hidden dark:border-zinc-800 dark:bg-zinc-900">
                {logo}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 focus:outline-none dark:text-zinc-200 dark:hover:bg-zinc-800"
                    aria-label="Open navigation menu"
                    aria-expanded={drawerOpen}
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* ===== Drawer navigasi mobile (semua tombol navbar) ===== */}
            <Dialog open={drawerOpen} onClose={closeDrawer} className="relative z-50 sm:hidden">
                <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                <div className="fixed inset-y-0 right-0 flex w-80 max-w-[85vw]">
                    <Dialog.Panel className="flex w-full flex-col overflow-y-auto bg-white pb-[env(safe-area-inset-bottom)] dark:bg-zinc-900">
                        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
                            {logo}
                            <button
                                onClick={closeDrawer}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 focus:outline-none dark:text-zinc-200 dark:hover:bg-zinc-800"
                                aria-label="Close navigation menu"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="px-3 pt-3">
                            <p className="truncate px-3 text-sm font-bold">{user.name}</p>
                            <p className="truncate px-3 text-xs text-zinc-500">{user.email}</p>
                        </div>

                        {navLinks(closeDrawer)}

                        <div className="space-y-2 border-t border-zinc-200 p-4 text-sm dark:border-zinc-800">
                            <button
                                onClick={toggleTheme}
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-left font-medium text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                            >
                                Toggle Theme
                            </button>
                            <Link
                                href={route('users.show', user.username)}
                                onClick={closeDrawer}
                                className="block rounded-xl px-3 py-2.5 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                My public profile
                            </Link>
                            <Link
                                href={route('profile.edit')}
                                onClick={closeDrawer}
                                className="block rounded-xl px-3 py-2.5 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                Edit profile
                            </Link>
                            <Link
                                href={route('settings.edit')}
                                onClick={closeDrawer}
                                className="block rounded-xl px-3 py-2.5 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                Settings
                            </Link>
                            {user.role === 'admin' && (
                                <Link
                                    href={route('admin.dashboard')}
                                    onClick={closeDrawer}
                                    className="block rounded-xl px-3 py-2.5 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Admin
                                </Link>
                            )}
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                onClick={closeDrawer}
                                className="block w-full rounded-xl px-3 py-2.5 text-left font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                                Log Out
                            </Link>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* ===== Konten kanan ===== */}
            <div className="flex min-h-screen flex-1 flex-col pb-[env(safe-area-inset-bottom)] sm:pl-64">
                {header && (
                    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{header}</div>
                    </header>
                )}

                <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <FlashMessages flash={flash} />
                    {children}

                    {/* Required attribution for exercise animations (exercises-dataset / WorkoutX). */}
                    <p className="mt-10 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
                        Exercise animations ©{' '}
                        <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">
                            Gym visual
                        </a>{' '}
                        and WorkoutX.
                    </p>
                </main>
            </div>
        </div>
    );
}
