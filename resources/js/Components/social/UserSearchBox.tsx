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
                className="block w-full rounded-xl border-zinc-500 bg-zinc-100 py-2 pl-9 pr-3 text-base sm:text-sm placeholder:text-zinc-400 dark:border-zinc-500 dark:bg-zinc-800 dark:text-white focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400"
            />
        </form>
    );
}
