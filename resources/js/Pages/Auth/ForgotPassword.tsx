import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout title="Reset your password">
            <Head title="Forgot password" />

            <p className="mb-6 text-sm text-zinc-400">Enter the email you signed up with and we'll send you a link to choose a new password.</p>

            {status && (
                <div role="status" className="mb-4 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm font-medium text-lime-300">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <InputLabel htmlFor="email" value="Email" />
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    autoComplete="email"
                    placeholder="you@example.com"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                />

                <InputError htmlFor="email" message={errors.email} className="mt-2" />

                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Sending…' : 'Email me a reset link'}
                </PrimaryButton>
            </form>

            <p className="mt-8 text-center text-sm text-zinc-400">
                Remembered it?{' '}
                <Link href={route('home')} className="font-bold text-zinc-100 underline decoration-lime-400 decoration-2 underline-offset-4 hover:text-lime-300">
                    Back to log in
                </Link>
            </p>
        </GuestLayout>
    );
}
