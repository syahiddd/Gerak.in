import PersonList from '@/Components/social/PersonList';
import UserSearchBox from '@/Components/social/UserSearchBox';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PersonRow } from '@/types';
import { Head } from '@inertiajs/react';

export default function People({ q, people }: { q: string; people: PersonRow[] }) {
    return (
        <AuthenticatedLayout>
            <Head title={q ? `Search: ${q}` : 'Find people'} />
            <div className="mx-auto max-w-2xl">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Find people</h1>
                {/* key re-seeds the box when the query changes via navigation */}
                <UserSearchBox key={q} initial={q} className="mt-5" />

                <div className="mt-5">
                    {q === '' ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Search by name or @username to find training partners.</p>
                    ) : people.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                            No one matches “{q}”. Check the spelling or try part of their name.
                        </p>
                    ) : (
                        <>
                            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                                {people.length} {people.length === 1 ? 'result' : 'results'} for “{q}”
                            </p>
                            <PersonList people={people} />
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
