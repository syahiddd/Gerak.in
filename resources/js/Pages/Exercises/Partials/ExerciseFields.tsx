import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Equipment, Muscle } from '@/types';

export const EXERCISE_TYPES = [
    { value: 'weight_reps', label: 'Weight × reps' },
    { value: 'bodyweight_reps', label: 'Bodyweight × reps' },
    { value: 'weighted_bodyweight', label: 'Weighted bodyweight' },
    { value: 'assisted_bodyweight', label: 'Assisted bodyweight' },
    { value: 'duration', label: 'Duration' },
    { value: 'distance_duration', label: 'Distance + duration' },
];

export interface ExerciseFormData {
    name: string;
    exercise_type: string;
    primary_muscle_id: string;
    equipment_id: string;
    description: string;
    instructions: string;
    video_url: string;
}

const FIELD =
    'mt-1 block w-full rounded-xl border-zinc-500 text-base sm:text-sm dark:border-zinc-500 dark:bg-zinc-800 focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400';

/** The same fields for creating and editing, so the two forms never drift apart. */
export default function ExerciseFields({
    data,
    setData,
    errors,
    muscles,
    equipment,
}: {
    data: ExerciseFormData;
    setData: <K extends keyof ExerciseFormData>(key: K, value: ExerciseFormData[K]) => void;
    errors: Partial<Record<keyof ExerciseFormData, string>>;
    muscles: Muscle[];
    equipment: Equipment[];
}) {
    return (
        <>
            <div>
                <InputLabel htmlFor="name" value="Name" />
                <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" placeholder="Cable fly (low to high)" required />
                <InputError htmlFor="name" message={errors.name} className="mt-2" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                <div>
                    <InputLabel htmlFor="exercise_type" value="How it's logged" />
                    <select id="exercise_type" value={data.exercise_type} onChange={(e) => setData('exercise_type', e.target.value)} className={FIELD} required>
                        {EXERCISE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <InputError htmlFor="exercise_type" message={errors.exercise_type} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="primary_muscle_id" value="Primary muscle" />
                    <select id="primary_muscle_id" value={data.primary_muscle_id} onChange={(e) => setData('primary_muscle_id', e.target.value)} className={FIELD}>
                        <option value="">None</option>
                        {muscles.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <InputError htmlFor="primary_muscle_id" message={errors.primary_muscle_id} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="equipment_id" value="Equipment" />
                    <select id="equipment_id" value={data.equipment_id} onChange={(e) => setData('equipment_id', e.target.value)} className={FIELD}>
                        <option value="">None</option>
                        {equipment.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>
                    <InputError htmlFor="equipment_id" message={errors.equipment_id} className="mt-2" />
                </div>
            </div>
            <div>
                <InputLabel htmlFor="description" value="Description (optional)" />
                <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} className={FIELD} />
                <InputError htmlFor="description" message={errors.description} className="mt-2" />
            </div>
            <div>
                <InputLabel htmlFor="instructions" value="Instructions (optional)" />
                <textarea id="instructions" value={data.instructions} onChange={(e) => setData('instructions', e.target.value)} rows={4} placeholder={'1. Set the pulleys at the lowest notch.\n2. Sweep the handles up to eye level.'} className={FIELD} />
                <InputError htmlFor="instructions" message={errors.instructions} className="mt-2" />
            </div>
            <div>
                <InputLabel htmlFor="video_url" value="Demo video link (optional)" />
                <TextInput id="video_url" type="url" value={data.video_url} onChange={(e) => setData('video_url', e.target.value)} placeholder="https://example.com/cable-fly.mp4" className="mt-1 block w-full" />
                <InputError htmlFor="video_url" message={errors.video_url} className="mt-2" />
            </div>
        </>
    );
}
