import BrandLogo from '@/Components/BrandLogo';
import { btn } from '@/Components/ui';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';

type Status = 403 | 404 | 429 | 500 | 503;

const COPY: Record<Status, { title: string; body: string }> = {
    403: { title: "You can't open this page", body: "It belongs to someone else, or your account doesn't have access to it." },
    404: { title: "This page isn't here", body: 'The link may be broken, or the page was moved or deleted.' },
    429: { title: 'Slow down a little', body: 'Too many requests in a short time. Wait a moment, then try again.' },
    500: { title: 'Something broke on our side', body: "It's not you. Your workouts are safe, try again in a moment." },
    503: { title: 'Gerak.in is under maintenance', body: "We're making changes and will be back shortly." },
};

export default function ErrorPage({ status }: { status: Status }) {
    // Unmatched URLs render before the session starts, so there may be no auth prop at all.
    const user = (usePage().props as { auth?: { user?: unknown } }).auth?.user;
    const { title, body } = COPY[status] ?? COPY[500];
    const retryable = status >= 500 || status === 429;
    const [canGoBack, setCanGoBack] = useState(false);
    useEffect(() => setCanGoBack(window.history.length > 1), []);

    return (
        <>
            <Head title={`${status} · ${title}`} />
            <div className="flex min-h-screen flex-col bg-zinc-100 px-6 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-10">
                <header>
                    <a href="/" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-400" aria-label="Gerak.in home">
                        <BrandLogo />
                    </a>
                </header>

                <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-16">
                    {/* The lime full stop echoes the one in the Gerak.in wordmark. */}
                    <p className="text-8xl font-extrabold leading-none tracking-tight tabular-nums sm:text-9xl" aria-hidden>
                        {status}
                        <span className="text-lime-500">.</span>
                    </p>
                    <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">{body}</p>

                    <div className="mt-8 flex flex-wrap gap-2">
                        {retryable ? (
                            <button type="button" onClick={() => window.location.reload()} className={btn.primary}>
                                <RotateCw className="h-4 w-4" aria-hidden />
                                Try again
                            </button>
                        ) : user ? (
                            <Link href={route('feed.index')} className={btn.primary}>
                                Back to your feed
                            </Link>
                        ) : (
                            <a href="/" className={btn.primary}>
                                Back to Gerak.in
                            </a>
                        )}
                        {canGoBack && status !== 503 && (
                            <button type="button" onClick={() => window.history.back()} className={btn.secondary}>
                                <ArrowLeft className="h-4 w-4" aria-hidden />
                                Previous page
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
