import { ReactNode } from 'react';

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
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
            {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
        </div>
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
            {hint && <p className="mt-1 text-sm text-zinc-500">{hint}</p>}
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
                                <strong>{pr.exercise}</strong> — {pr.type}: {pr.detail}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
