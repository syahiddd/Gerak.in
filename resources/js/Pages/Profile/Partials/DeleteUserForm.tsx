import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { btn } from '@/Components/ui';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-bold">Delete account</h2>

                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Deleting your account permanently removes your workouts, routines, records, photos and posts. It can't be undone.
                </p>
            </header>

            <button type="button" onClick={confirmUserDeletion} className={`${btn.danger} border border-red-300 dark:border-red-800`}>
                Delete account
            </button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-extrabold">Delete your Gerak.in account?</h2>

                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                        Every workout, routine, record, photo and post is deleted for good. Enter your password to confirm.
                    </p>

                    <div className="mt-6">
                        <InputLabel htmlFor="delete-password" value="Password" />

                        <TextInput
                            id="delete-password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-full"
                            autoComplete="current-password"
                            isFocused
                        />

                        <InputError htmlFor="delete-password"
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton onClick={closeModal}>
                            Keep my account
                        </SecondaryButton>

                        <DangerButton disabled={processing}>
                            {processing ? 'Deleting…' : 'Delete account'}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
