import { confirmAction } from '@/Components/ConfirmDialog';
import TextInput from '@/Components/TextInput';
import { btn, EmptyState, Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Paginated, User } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function AdminUsers({ users }: { users: Paginated<User & { is_suspended: boolean; role: string }> }) {
    // Keep the current query in the box after searching.
    const [q, setQ] = useState(() => new URL(window.location.href).searchParams.get('q') ?? '');
    const search = useForm({});

    const suspend = async (u: User) => {
        const ok = await confirmAction({
            title: `Suspend ${u.name}?`,
            body: `${u.email} won't be able to log in until an admin activates the account again.`,
            confirmLabel: 'Suspend account',
        });
        if (ok) router.post(route('admin.users.suspend', u.id), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Admin: Users</h1>}>
            <Head title="Admin users" />

            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    search.get(route('admin.users', { q: q || undefined }));
                }}
                className="flex max-w-md gap-2"
            >
                <label htmlFor="user-search" className="sr-only">
                    Search users by name or email
                </label>
                <TextInput id="user-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" className="block w-full" />
                <button className={btn.secondary}>Search</button>
            </form>

            {users.data.length === 0 ? (
                <div className="mt-4">
                    <EmptyState
                        title={q ? `No users match “${q}”` : 'No users yet'}
                        hint={q ? 'Check the spelling, or search by email instead.' : undefined}
                        action={
                            q ? (
                                <Link href={route('admin.users')} className={btn.secondary}>
                                    Clear search
                                </Link>
                            ) : undefined
                        }
                    />
                </div>
            ) : (
                <ul className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                    {users.data.map((u) => (
                        <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                            <div className="min-w-0">
                                <p className="font-bold">
                                    {u.name}{' '}
                                    {u.is_suspended && (
                                        <span className="ms-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">Suspended</span>
                                    )}
                                </p>
                                <p className="break-all text-zinc-500 dark:text-zinc-400">
                                    {u.email} · {String(u.role)}
                                </p>
                            </div>
                            {u.is_suspended ? (
                                <Link href={route('admin.users.activate', u.id)} method="post" as="button" preserveScroll className={btn.secondary}>
                                    Activate
                                </Link>
                            ) : (
                                <button type="button" onClick={() => suspend(u)} className={btn.danger}>
                                    Suspend
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <Pagination links={users.links} />
        </AuthenticatedLayout>
    );
}
