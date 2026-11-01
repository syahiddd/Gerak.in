import { confirmAction } from '@/Components/ConfirmDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import { btn } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Equipment, Exercise, Muscle } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import ExerciseFields, { ExerciseFormData } from './Partials/ExerciseFields';

export default function ExerciseEdit({
    exercise,
    muscles,
    equipment,
}: {
    exercise: Exercise;
    muscles: Muscle[];
    equipment: Equipment[];
}) {
    const { data, setData, patch, processing, errors, delete: destroy } = useForm<ExerciseFormData>({
        name: exercise.name,
        exercise_type: exercise.exercise_type,
        primary_muscle_id: exercise.primary_muscle_id ? String(exercise.primary_muscle_id) : '',
        equipment_id: exercise.equipment_id ? String(exercise.equipment_id) : '',
        description: exercise.description ?? '',
        instructions: exercise.instructions ?? '',
        video_url: exercise.video_url ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('exercises.update', exercise.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <Link href={route('exercises.show', exercise.slug)} className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                        ← {exercise.name}
                    </Link>
                    <h1 className="mt-1 text-xl font-extrabold">Edit exercise</h1>
                </div>
            }
        >
            <Head title={`Edit ${exercise.name}`} />

            <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <ExerciseFields data={data} setData={setData} errors={errors} muscles={muscles} equipment={equipment} />
                <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save changes'}</PrimaryButton>
            </form>

            {/* Kept apart from Save so the destructive action is never the next thing under the thumb. */}
            <section className="mt-6 max-w-2xl rounded-2xl border border-red-200 bg-white p-5 dark:border-red-900/60 dark:bg-zinc-900">
                <h2 className="font-bold">Delete exercise</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">It leaves the exercise library. Workouts you already logged keep their sets.</p>
                <button
                    type="button"
                    className={`${btn.danger} mt-3 border border-red-300 dark:border-red-800`}
                    onClick={async () => {
                        if (await confirmAction({ title: `Delete "${exercise.name}"?`, body: 'It leaves the exercise library and the picker. Workouts you already logged keep their sets.', confirmLabel: 'Delete exercise' })) {
                            destroy(route('exercises.destroy', exercise.id));
                        }
                    }}
                >
                    Delete exercise
                </button>
            </section>
        </AuthenticatedLayout>
    );
}
