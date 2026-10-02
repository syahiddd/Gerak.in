import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    bio = null,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    bio?: string | null;
    className?: string;
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            username: user.username,
            bio: bio ?? '',
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="username" value="Username" />

                    <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">@</span>
                        <TextInput
                            id="username"
                            className="block w-full pl-7"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value.toLowerCase())}
                            required
                            minLength={3}
                            maxLength={30}
                            pattern="[a-z0-9_.]{3,30}"
                            autoComplete="off"
                            aria-describedby="username-hint"
                        />
                    </div>
                    <p id="username-hint" className="mt-1 text-xs text-zinc-500">
                        3–30 characters: lowercase letters, numbers, _ and . Your profile lives at{' '}
                        <Link href={route('users.show', user.username)} className="font-semibold underline">
                            /u/{user.username}
                        </Link>
                        .
                    </p>

                    <InputError className="mt-2" message={errors.username} />
                </div>

                <div>
                    <InputLabel htmlFor="bio" value="Bio" />

                    <textarea
                        id="bio"
                        rows={3}
                        maxLength={500}
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        placeholder="Training for my first powerlifting meet."
                        className="mt-1 block w-full rounded-xl border-zinc-300 text-sm shadow-sm focus:border-lime-400 focus:ring-lime-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-zinc-500">Shown on your public profile.</p>

                    <InputError className="mt-2" message={errors.bio} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-zinc-200">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-zinc-400">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
