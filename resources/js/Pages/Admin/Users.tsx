import TextInput from '@/Components/TextInput';
import { Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Paginated, User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function AdminUsers({ users }: { users: Paginated<User & { is_suspended: boolean; role: string }> }) {
    const [q, setQ] = useState('');
    const search = useForm({});

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Admin — Users</h1>}>
            <Head title="Admin users" />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    search.get(route('admin.users', { q: q || undefined }));
                }}
                className="flex max-w-md gap-2"
            >
                <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="block w-full" />
                <button className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">
                    Search
                </button>
            </form>

            <div className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {users.data.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 text-sm">
                        <div>
                            <p className="font-bold">
                                {u.name} {u.is_suspended && <span className="text-red-500">(suspended)</span>}
                            </p>
                            <p className="text-zinc-500">{u.email} · {String(u.role)}</p>
                        </div>
                        {u.is_suspended ? (
                            <Link href={route('admin.users.activate', u.id)} method="post" as="button" className="rounded-xl border border-zinc-300 px-3 py-1 font-bold dark:border-zinc-700">
                                Activate
                            </Link>
                        ) : (
                            <Link href={route('admin.users.suspend', u.id)} method="post" as="button" className="rounded-xl border border-red-300 px-3 py-1 font-bold text-red-500">
                                Suspend
                            </Link>
                        )}
                    </div>
                ))}
            </div>
            <Pagination links={users.links} />
        </AuthenticatedLayout>
    );
}
