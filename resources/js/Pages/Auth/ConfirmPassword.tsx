import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout title="Confirm your password">
            <Head title="Confirm password" />

            <p className="mb-6 text-sm text-zinc-400">This part of your account is protected. Enter your password to continue.</p>

            <form onSubmit={submit}>
                <InputLabel htmlFor="password" value="Password" />

                <TextInput
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    className="mt-1 block w-full"
                    autoComplete="current-password"
                    isFocused={true}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                <InputError htmlFor="password" message={errors.password} className="mt-2" />

                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Checking…' : 'Continue'}
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
