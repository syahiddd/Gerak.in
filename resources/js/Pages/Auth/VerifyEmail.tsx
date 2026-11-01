import PrimaryButton from '@/Components/PrimaryButton';
import { btn } from '@/Components/ui';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout title="Verify your email">
            <Head title="Verify email" />

            <p className="mb-6 text-sm text-zinc-400">
                We sent a link to your email. Open it to finish signing up. Can't find it? Check your spam folder, or send a new one.
            </p>

            {status === 'verification-link-sent' && (
                <div role="status" className="mb-4 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm font-medium text-lime-300">
                    New link sent. It may take a minute to arrive.
                </div>
            )}

            <form onSubmit={submit} className="flex flex-wrap items-center justify-between gap-3">
                <PrimaryButton disabled={processing}>{processing ? 'Sending…' : 'Send a new link'}</PrimaryButton>

                <Link href={route('logout')} method="post" as="button" className={btn.ghost}>
                    Log out
                </Link>
            </form>
        </GuestLayout>
    );
}
