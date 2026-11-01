import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Equipment, Muscle } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import ExerciseFields, { ExerciseFormData } from './Partials/ExerciseFields';

export default function ExerciseCreate({ muscles, equipment }: { muscles: Muscle[]; equipment: Equipment[] }) {
    const { data, setData, post, processing, errors } = useForm<ExerciseFormData>({
        name: '',
        exercise_type: 'weight_reps',
        primary_muscle_id: '',
        equipment_id: '',
        description: '',
        instructions: '',
        video_url: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('exercises.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <Link href={route('exercises.index')} className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                        ← Exercise library
                    </Link>
                    <h1 className="mt-1 text-xl font-extrabold">New custom exercise</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Only you see your custom exercises.</p>
                </div>
            }
        >
            <Head title="New exercise" />

            <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <ExerciseFields data={data} setData={setData} errors={errors} muscles={muscles} equipment={equipment} />
                <PrimaryButton disabled={processing}>{processing ? 'Creating…' : 'Create exercise'}</PrimaryButton>
            </form>
        </AuthenticatedLayout>
    );
}
