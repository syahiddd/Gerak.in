import { confirmAction } from '@/Components/ConfirmDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Announce } from '@/Components/ui';
import Avatar from '@/Components/social/Avatar';
import { btn } from '@/Components/ui';
import { formatBytes, toSquareWebp } from '@/lib/image';
import { Camera } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useEffect, useRef, useState } from 'react';

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
                <h2 className="text-lg font-bold">Profile</h2>

                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Your name, username, bio and photo appear on your public profile. Your email stays private.</p>
            </header>

            <ProfilePhotoField />

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />

                    <InputError htmlFor="name" className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="username" value="Username" />

                    <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 dark:text-zinc-400" aria-hidden>@</span>
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
                    <p id="username-hint" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        3–30 characters: lowercase letters, numbers, _ and . Your profile lives at{' '}
                        <Link href={route('users.show', user.username)} className="font-semibold underline">
                            /u/{user.username}
                        </Link>
                        .
                    </p>

                    <InputError htmlFor="username" className="mt-2" message={errors.username} />
                </div>

                <div>
                    <InputLabel htmlFor="bio" value="Bio (optional)" />

                    <textarea
                        id="bio"
                        rows={3}
                        maxLength={500}
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        placeholder="Training for my first powerlifting meet."
                        className="mt-1 block w-full rounded-xl border-zinc-500 text-base sm:text-sm shadow-sm dark:border-zinc-500 dark:bg-zinc-800 dark:text-white focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400"
                    />
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Shown on your public profile. Up to 500 characters.</p>

                    <InputError htmlFor="bio" className="mt-2" message={errors.bio} />
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

                    <InputError htmlFor="email" className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
                            Your email isn't verified yet.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded font-semibold underline hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:hover:text-white dark:focus-visible:ring-lime-400"
                            >
                                Send a new verification link
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <p role="status" className="mt-2 text-sm font-semibold text-lime-700 dark:text-lime-400">
                                New link sent. Check your inbox.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save profile'}</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-semibold text-lime-700 dark:text-lime-400">Profile saved</p>
                    </Transition>
                    <Announce text={recentlySuccessful ? 'Profile saved' : null} />
                </div>
            </form>
        </section>
    );
}

/**
 * Profile photo picker. The photo is center-cropped and converted to WebP in the
 * browser, then uploaded right away (independent of the Save button below).
 */
function ProfilePhotoField() {
    const user = usePage().props.auth.user;
    const input = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);

    const pick = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setError(null);
        setNote(null);

        if (!file.type.startsWith('image/')) {
            setError('Choose an image file (JPG, PNG or WebP).');
            return;
        }

        setBusy(true);
        let avatar: File;
        try {
            avatar = await toSquareWebp(file);
        } catch {
            setBusy(false);
            setError("This photo couldn't be read by your browser. Try a JPG or PNG.");
            return;
        }

        setPreview(URL.createObjectURL(avatar));
        const format = avatar.type === 'image/webp' ? 'WebP' : 'JPG';
        router.post(
            route('profile.avatar.update'),
            { avatar },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setNote('Photo saved'),
                onError: (errs) => {
                    setPreview(null);
                    setError(errs.avatar ?? 'Upload failed. Try again.');
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    const remove = async () => {
        if (!(await confirmAction({ title: 'Remove your profile photo?', body: 'Your initials show instead. You can upload a new photo any time.', confirmLabel: 'Remove photo' }))) return;
        setPreview(null);
        setNote(null);
        router.delete(route('profile.avatar.destroy'), {
            preserveScroll: true,
            onSuccess: () => setNote('Photo removed'),
            onError: () => setError("Couldn't remove the photo. Try again."),
        });
    };

    const hasPhoto = !!(preview || user.avatar_url);

    return (
        <div className="mt-6 flex items-center gap-5">
            <div className="relative">
                <Avatar user={user} size="xl" src={preview} />
                {busy && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-zinc-950/60 text-xs font-bold text-white">
                        Uploading…
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-semibold dark:text-white">Profile photo</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => input.current?.click()}
                        disabled={busy}
                        className={btn.secondary}
                    >
                        <Camera className="h-4 w-4" aria-hidden />
                        {hasPhoto ? 'Change photo' : 'Upload photo'}
                    </button>
                    {hasPhoto && (
                        <button
                            type="button"
                            onClick={remove}
                            disabled={busy}
                            className={btn.danger}
                        >
                            Remove
                        </button>
                    )}
                </div>
                <input ref={input} type="file" accept="image/*" onChange={pick} className="hidden" />
                <Announce text={error ?? note} />
                {error ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : note ? (
                    <p className="mt-2 text-xs font-semibold text-lime-700 dark:text-lime-400">{note}</p>
                ) : (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Cropped to a square from the center and saved as WebP.</p>
                )}
            </div>
        </div>
    );
}
