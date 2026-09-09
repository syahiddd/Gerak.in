import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Exercise } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Row {
    exercise_id: string;
    rest_seconds: number;
}

export default function RoutineCreate({ exercises }: { exercises: Exercise[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        exercises: [{ exercise_id: '', rest_seconds: 90 }] as Row[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('routines.store'));
    };

    const setRow = (i: number, patch: Partial<Row>) => {
        const rows = [...data.exercises];
        rows[i] = { ...rows[i], ...patch };
        setData('exercises', rows);
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">New routine</h1>}>
            <Head title="New routine" />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                    <InputLabel htmlFor="name" value="Routine name" />
                    <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" required placeholder="Push Day" />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>
                <div>
                    <InputLabel htmlFor="description" value="Description" />
                    <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </div>

                <h2 className="font-bold">Exercises</h2>
                {data.exercises.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="col-span-7">
                            <label className="text-xs font-semibold">Exercise</label>
                            <select value={row.exercise_id} onChange={(e) => setRow(i, { exercise_id: e.target.value })} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" required>
                                <option value="">Select…</option>
                                {exercises.map((ex) => (
                                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-3">
                            <label className="text-xs font-semibold">Rest (s)</label>
                            <input type="number" value={row.rest_seconds} onChange={(e) => setRow(i, { rest_seconds: Number(e.target.value) })} min={0} max={3600} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                        </div>
                        <div className="col-span-2">
                            <button type="button" onClick={() => setData('exercises', data.exercises.filter((_, j) => j !== i))} className="w-full rounded-xl border border-red-300 px-2 py-2 text-sm font-bold text-red-500">
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => setData('exercises', [...data.exercises, { exercise_id: '', rest_seconds: 90 }])}
                    className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold dark:border-zinc-700"
                >
                    + Add exercise
                </button>

                <div>
                    <PrimaryButton disabled={processing}>Create routine</PrimaryButton>
                </div>
                <p className="text-xs text-zinc-500">Target sets default to 3× normal. The routine stays a template — tune weight/reps per workout.</p>
            </form>
        </AuthenticatedLayout>
    );
}
