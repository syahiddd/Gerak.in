import BrandLogo from '@/Components/BrandLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

// Same look as the login page (Welcome): always dark, logo top-left, form in a narrow column.
// The `dark` class here turns on the components' dark: styles regardless of the user's theme.
export default function Guest({ title, children }: PropsWithChildren<{ title?: string }>) {
    return (
        <div className="dark flex min-h-screen flex-col bg-zinc-950 px-6 py-6 text-zinc-100 sm:px-12">
            <Link href="/" className="flex w-fit items-center gap-2.5">
                <BrandLogo size="lg" accent="text-lime-400" />
            </Link>

            <div className="flex flex-1 items-center justify-center py-10">
                <div className="w-full max-w-sm">
                    {title && <h1 className="mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>}
                    {children}
                </div>
            </div>
        </div>
    );
}
