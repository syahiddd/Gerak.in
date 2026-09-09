import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Equipment, Muscle } from '@/types';
import { Head, useForm } from '@inertiajs/react';

const TYPES = [
    { value: 'weight_reps', label: 'Weight × Reps' },
    { value: 'bodyweight_reps', label: 'Bodyweight × Reps' },
    { value: 'weighted_bodyweight', label: 'Weighted Bodyweight' },
    { value: 'assisted_bodyweight', label: 'Assisted Bodyweight' },
    { value: 'duration', label: 'Duration' },
    { value: 'distance_duration', label: 'Distance + Duration' },
];

export default function ExerciseCreate({ muscles, equipment }: { muscles: Muscle[]; equipment: Equipment[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        exercise_type: 'weight_reps',
        primary_muscle_id: '',
        equipment_id: '',
        description: '',
        instructions: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('exercises.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">New custom exercise</h1>}>
            <Head title="New exercise" />

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
                        <InputError message={errors.exercise_type} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="primary_muscle_id" value="Primary muscle" />
                        <select id="primary_muscle_id" value={data.primary_muscle_id} onChange={(e) => setData('primary_muscle_id', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                            <option value="">—</option>
                            {muscles.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="equipment_id" value="Equipment" />
                        <select id="equipment_id" value={data.equipment_id} onChange={(e) => setData('equipment_id', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                            <option value="">—</option>
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
                    <InputLabel htmlFor="instructions" value="Instructions" />
                    <textarea id="instructions" value={data.instructions} onChange={(e) => setData('instructions', e.target.value)} rows={4} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </div>
                <PrimaryButton disabled={processing}>Create exercise</PrimaryButton>
            </form>
        </AuthenticatedLayout>
    );
}
