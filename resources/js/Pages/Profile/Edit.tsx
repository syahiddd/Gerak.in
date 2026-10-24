import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    bio,
}: PageProps<{ mustVerifyEmail: boolean; status?: string; bio?: string | null }>) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <Link href={route('profile.show')} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                        ← Profile
                    </Link>
                    <h1 className="mt-1 text-xl font-semibold leading-tight text-gray-800 dark:text-white">Edit profile</h1>
                </div>
            }
        >
            <Head title="Edit profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 sm:p-8 dark:bg-zinc-900 dark:ring-zinc-800">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            bio={bio}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 sm:p-8 dark:bg-zinc-900 dark:ring-zinc-800">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 sm:p-8 dark:bg-zinc-900 dark:ring-zinc-800">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
