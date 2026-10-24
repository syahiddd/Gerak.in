import ExerciseMedia from '@/Components/ExerciseMedia';
import { api } from '@/lib/api';
import { ExerciseOption } from '@/types';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Searchable exercise picker. With 1,300+ exercises a <select> can't list them
 * all, so this queries GET /exercises/lookup as you type (empty = recently used).
 */
export default function ExercisePicker({
    value,
    onChange,
    placeholder = 'Search 1,300+ exercises…',
    id,
    required = false,
    className = '',
}: {
    value: ExerciseOption | null;
    onChange: (exercise: ExerciseOption | null) => void;
    placeholder?: string;
    id?: string;
    required?: boolean;
    className?: string;
}) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<ExerciseOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            setLoading(true);
            setError(false);
            api.lookupExercises(query.trim(), controller.signal)
                .then(setOptions)
                .catch((e) => e.name !== 'AbortError' && setError(true))
                .finally(() => !controller.signal.aborted && setLoading(false));
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return (
        <Combobox value={value} onChange={onChange} onClose={() => setQuery('')} by="id" immediate>
            <div className={`relative ${className}`}>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
                <ComboboxInput
                    id={id}
                    required={required}
                    autoComplete="off"
                    displayValue={(ex: ExerciseOption | null) => ex?.name ?? ''}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="block w-full rounded-xl border-zinc-300 py-2 pl-9 pr-9 text-sm focus:border-lime-400 focus:ring-lime-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400" aria-label="Show exercises">
                    <ChevronDown className="h-4 w-4" />
                </ComboboxButton>
            </div>

            <ComboboxOptions
                anchor="bottom start"
                className="z-50 mt-1 max-h-80 w-[var(--input-width)] min-w-72 overflow-y-auto rounded-xl bg-white p-1 shadow-lg ring-1 ring-zinc-200 empty:invisible focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700"
            >
                {!loading && !error && options.length === 0 && (
                    <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">No exercises match “{query}”.</p>
                )}
                {error && <p className="px-3 py-2 text-sm text-red-500">Couldn't load exercises. Check your connection and try again.</p>}
                {query === '' && options.length > 0 && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Recent &amp; suggested</p>
                )}
                {options.map((ex) => (
                    <ComboboxOption
                        key={ex.id}
                        value={ex}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 data-[focus]:bg-zinc-100 data-[selected]:font-bold dark:data-[focus]:bg-zinc-700"
                    >
                        <ExerciseMedia exercise={ex} variant="inline" />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-zinc-900 dark:text-zinc-100">{ex.name}</span>
                            {ex.primary_muscle && <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{ex.primary_muscle.name}</span>}
                        </span>
                    </ComboboxOption>
                ))}
                {loading && <p className="px-3 py-2 text-xs text-zinc-400">Searching…</p>}
            </ComboboxOptions>
        </Combobox>
    );
}
