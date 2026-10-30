import { ReactNode } from 'react';

// One button scale for the whole app. 44px min height because sets get logged mid-workout, on a phone.
const btnBase =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50';

export const btn = {
    // The one action the screen is for. Use once per view.
    primary: `${btnBase} bg-lime-400 text-zinc-950 hover:bg-lime-300`,
    secondary: `${btnBase} border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800`,
    // Low-weight shortcuts that shouldn't compete with the buttons above them.
    ghost: `${btnBase} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white`,
    // Destructive but secondary (cancel, delete): visible, never louder than the main action.
    danger: `${btnBase} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`,
    // Final confirmation inside a destructive dialog.
    dangerSolid: `${btnBase} bg-red-600 text-white hover:bg-red-500`,
    icon: 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
};

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl bg-white border border-zinc-200 p-5 dark:bg-zinc-900 dark:border-zinc-800 ${className}`}>
            {children}
        </div>
    );
}

export function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
    return (
        <div className="rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
            {sub && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
        </div>
    );
}

/** Ranked sets-per-muscle list. Answers "what did I train most" better than a multi-colour pie. */
export function MuscleBars({ labels, sets }: { labels: string[]; sets: number[] }) {
    const max = Math.max(1, ...sets);

    return (
        <ul className="mt-3 space-y-2">
            {labels.map((name, i) => (
                <li key={name} className="text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="truncate">{name}</span>
                        <span className="font-bold tabular-nums">{sets[i] ?? 0}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                            className="h-full origin-left rounded-full bg-lime-400 motion-safe:animate-bar-grow"
                            style={{ width: `${((sets[i] ?? 0) / max) * 100}%`, animationDelay: `${i * 60}ms` }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function EmptyState({
    title,
    hint,
    action,
}: {
    title: string;
    hint?: string;
    action?: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="font-bold">{title}</p>
            {hint && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function Chip({ children }: { children: ReactNode }) {
    return (
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold dark:bg-zinc-800">
            {children}
        </span>
    );
}

export function PrimaryLink({ href, children, method }: { href: string; children: ReactNode; method?: 'post' | 'delete' | 'patch' }) {
    // Rendered via Inertia Link by callers; this is a styled anchor fallback.
    return (
        <a
            href={href}
            data-method={method}
            className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-lime-300"
        >
            {children}
        </a>
    );
}

export function Pagination({ links }: { links: { url: string | null; label: string; active: boolean }[] }) {
    if (links.length <= 3) return null;
    return (
        <div className="mt-4 flex flex-wrap gap-1">
            {links.map((l, i) =>
                l.url ? (
                    <a
                        key={i}
                        href={l.url}
                        className={`rounded-lg px-3 py-1 text-sm ${l.active ? 'bg-lime-400 font-bold text-zinc-950' : 'border border-zinc-300 dark:border-zinc-700'}`}
                        dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                ) : (
                    <span key={i} className="px-3 py-1 text-sm text-zinc-400" dangerouslySetInnerHTML={{ __html: l.label }} />
                ),
            )}
        </div>
    );
}

export function FlashMessages({ flash }: { flash: { success?: string | null; info?: string | null; pr_events?: { exercise: string; type: string; detail: string }[] | null } }) {
    return (
        <>
            {flash.success && (
                <div className="mb-4 rounded-xl border border-lime-300 bg-lime-100 px-4 py-3 text-sm text-lime-900 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-200" role="status">
                    {flash.success}
                </div>
            )}
            {flash.info && (
                <div className="mb-4 rounded-xl border border-sky-300 bg-sky-100 px-4 py-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200" role="status">
                    {flash.info}
                </div>
            )}
            {flash.pr_events && flash.pr_events.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" role="status">
                    <p className="font-bold">New Personal Record{flash.pr_events.length > 1 ? 's' : ''}!</p>
                    <ul className="ms-5 mt-1 list-disc">
                        {flash.pr_events.map((pr, i) => (
                            <li key={i}>
                                <strong>{pr.exercise}</strong> ({pr.type}: {pr.detail})
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
