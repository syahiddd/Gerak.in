import { confirmAction } from '@/Components/ConfirmDialog';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Equipment, Exercise, Muscle } from '@/types';
import { Head, useForm } from '@inertiajs/react';

const TYPES = [
    { value: 'weight_reps', label: 'Weight × Reps' },
    { value: 'bodyweight_reps', label: 'Bodyweight × Reps' },
    { value: 'weighted_bodyweight', label: 'Weighted Bodyweight' },
    { value: 'assisted_bodyweight', label: 'Assisted Bodyweight' },
    { value: 'duration', label: 'Duration' },
    { value: 'distance_duration', label: 'Distance + Duration' },
];

export default function ExerciseEdit({
    exercise,
    muscles,
    equipment,
}: {
    exercise: Exercise;
    muscles: Muscle[];
    equipment: Equipment[];
}) {
    const { data, setData, patch, processing, errors, delete: destroy } = useForm({
        name: exercise.name,
        exercise_type: exercise.exercise_type,
        primary_muscle_id: exercise.primary_muscle_id ? String(exercise.primary_muscle_id) : '',
        equipment_id: exercise.equipment_id ? String(exercise.equipment_id) : '',
        description: exercise.description ?? '',
        video_url: exercise.video_url ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('exercises.update', exercise.id));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Edit: {exercise.name}</h1>}>
            <Head title={`Edit ${exercise.name}`} />

            <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" required />
                    <InputError message={errors.name} className="mt-2" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                        <InputLabel htmlFor="exercise_type" value="Type" />
                        <select id="exercise_type" value={data.exercise_type} onChange={(e) => setData('exercise_type', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" required>
                            {TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="primary_muscle_id" value="Primary muscle" />
                        <select id="primary_muscle_id" value={data.primary_muscle_id} onChange={(e) => setData('primary_muscle_id', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                            <option value="">None</option>
                            {muscles.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="equipment_id" value="Equipment" />
                        <select id="equipment_id" value={data.equipment_id} onChange={(e) => setData('equipment_id', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                            <option value="">None</option>
                            {equipment.map((e) => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <InputLabel htmlFor="description" value="Description" />
                    <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </div>
                <div>
                    <InputLabel htmlFor="video_url" value="Video URL (optional demo video)" />
                    <TextInput id="video_url" type="url" value={data.video_url} onChange={(e) => setData('video_url', e.target.value)} placeholder="https://..." className="mt-1 block w-full" />
                    <InputError message={errors.video_url} className="mt-2" />
                </div>
                <PrimaryButton disabled={processing}>Save</PrimaryButton>
            </form>

            <div className="mt-3 max-w-2xl">
                <DangerButton
                    onClick={async () => {
                        if (await confirmAction({ title: 'Delete this exercise?', body: 'This can’t be undone.', confirmLabel: 'Delete exercise' })) destroy(route('exercises.destroy', exercise.id));
                    }}
                >
                    Delete exercise
                </DangerButton>
            </div>
        </AuthenticatedLayout>
    );
}
