import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { btn } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ExercisePicker from '@/Components/ExercisePicker';
import { ExerciseOption } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Row {
    exercise_id: string;
    rest_seconds: number;
    /** Picked option, kept so the name/GIF stay visible; stripped before submit. */
    exercise: ExerciseOption | null;
}

const emptyRow = (): Row => ({ exercise_id: '', rest_seconds: 90, exercise: null });

export default function RoutineCreate() {
    const { data, setData, post, processing, errors, transform } = useForm({
        name: '',
        description: '',
        exercises: [emptyRow()],
    });

    transform((d) => ({ ...d, exercises: d.exercises.map(({ exercise_id, rest_seconds }) => ({ exercise_id, rest_seconds })) }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('routines.store'));
    };

    const rowError = (i: number) => (errors as Record<string, string>)[`exercises.${i}.exercise_id`];

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
                    <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" required placeholder="Push day" />
                    <InputError htmlFor="name" message={errors.name} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="description" value="Description (optional)" />
                    <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} className="mt-1 block w-full rounded-xl border-zinc-500 text-base sm:text-sm dark:border-zinc-500 dark:bg-zinc-800 focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400" />
                    <InputError htmlFor="description" message={errors.description} className="mt-2" />
                </div>

                <div>
                    <h2 className="font-bold">Exercises</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Each starts with your default number of sets from Settings. Set target weight and reps after you create the routine.</p>
                </div>
                {data.exercises.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        {/* Phone: exercise on its own row; rest + remove share the second row. */}
                        <div className="col-span-12 sm:col-span-7">
                            <label className="text-xs font-semibold" htmlFor={`exercise-${i}`}>
                                Exercise {i + 1}
                            </label>
                            <ExercisePicker
                                id={`exercise-${i}`}
                                className="mt-1"
                                value={row.exercise}
                                onChange={(ex) => setRow(i, { exercise: ex, exercise_id: ex ? String(ex.id) : '' })}
                            />
                            <InputError htmlFor={`exercise-${i}`} message={rowError(i) ? 'Choose an exercise from the list.' : undefined} className="mt-1 text-xs" />
                        </div>
                        <div className="col-span-7 sm:col-span-3">
                            <label className="text-xs font-semibold" htmlFor={`rest-${i}`}>
                                Rest (seconds)
                            </label>
                            <input id={`rest-${i}`} type="number" inputMode="numeric" value={row.rest_seconds} onChange={(e) => setRow(i, { rest_seconds: Number(e.target.value) })} min={0} max={3600} className="mt-1 block w-full rounded-xl border-zinc-500 text-base sm:text-sm dark:border-zinc-500 dark:bg-zinc-800 focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400" />
                        </div>
                        <div className="col-span-5 sm:col-span-2">
                            {/* A routine needs at least one exercise, so the last row can't be removed. */}
                            <button
                                type="button"
                                onClick={() => setData('exercises', data.exercises.filter((_, j) => j !== i))}
                                disabled={data.exercises.length === 1}
                                className={`${btn.danger} w-full`}
                                aria-label={`Remove exercise ${i + 1}`}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                <InputError message={(errors as Record<string, string>).exercises} />
                <button
                    type="button"
                    onClick={() => setData('exercises', [...data.exercises, emptyRow()])}
                    className={btn.secondary}
                >
                    Add another exercise
                </button>

                <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <PrimaryButton disabled={processing}>{processing ? 'Creating…' : 'Create routine'}</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
