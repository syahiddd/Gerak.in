import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

/** Submits to the people search page; used in the sidebar and on the feed. */
export default function UserSearchBox({ initial = '', className = '' }: { initial?: string; className?: string }) {
    const [q, setQ] = useState(initial);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (q.trim()) router.get(route('users.search'), { q: q.trim() });
    };

    return (
        <form onSubmit={submit} role="search" className={`relative ${className}`}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users"
                aria-label="Search users"
                className="block w-full rounded-xl border-zinc-300 bg-zinc-100 py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-lime-400 focus:ring-lime-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
        </form>
    );
}
