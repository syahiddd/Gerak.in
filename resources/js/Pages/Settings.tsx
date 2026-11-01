import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { applyTheme } from '@/hooks/workout';
import { User, UserSettings, WorkoutVisibility } from '@/types';
import { Head, useForm } from '@inertiajs/react';

const SELECT =
    'mt-1 block w-full rounded-xl border-zinc-500 text-base sm:text-sm dark:border-zinc-500 dark:bg-zinc-800 focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400';

// The browser's own IANA list; keeps the saved value selectable even if it isn't in it.
const zones = (current: string): string[] => {
    const list = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return list.includes(current) ? list : [current, ...list];
};

export default function Settings({ user, settings }: { user: User; settings: UserSettings }) {
    const { data, setData, patch, processing, errors } = useForm({
        unit_system: settings.unit_system,
        theme: settings.theme,
        default_rest_seconds: settings.default_rest_seconds,
        default_sets: settings.default_sets,
        week_starts_on: settings.week_starts_on,
        default_workout_visibility: settings.default_workout_visibility ?? 'public',
        timezone: user.timezone,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('settings.update'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Settings</h1>}>
            <Head title="Settings" />

            <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="unit_system" value="Units" />
                        <select id="unit_system" value={data.unit_system} onChange={(e) => setData('unit_system', e.target.value as 'metric' | 'imperial')} className={SELECT}>
                            <option value="metric">Metric (kg, cm)</option>
                            <option value="imperial">Imperial (lb, in)</option>
                        </select>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Used for every weight and measurement you log and see.</p>
                        <InputError htmlFor="unit_system" message={errors.unit_system} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="theme" value="Theme" />
                        <select
                            id="theme"
                            value={data.theme}
                            onChange={(e) => {
                                const t = e.target.value as 'system' | 'light' | 'dark';
                                setData('theme', t);
                                applyTheme(t);
                            }}
                            className={SELECT}
                        >
                            <option value="system">Same as device</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                        <InputError htmlFor="theme" message={errors.theme} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="default_rest_seconds" value="Default rest (seconds)" />
                        <TextInput id="default_rest_seconds" type="number" inputMode="numeric" min={0} max={3600} value={data.default_rest_seconds} onChange={(e) => setData('default_rest_seconds', Number(e.target.value))} className="mt-1 block w-full" required aria-describedby="rest-hint" />
                        <p id="rest-hint" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">0 to 3600. 90 is 1:30.</p>
                        <InputError htmlFor="default_rest_seconds" message={errors.default_rest_seconds} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="default_sets" value="Default sets" />
                        <TextInput id="default_sets" type="number" inputMode="numeric" min={1} max={20} value={data.default_sets} onChange={(e) => setData('default_sets', Number(e.target.value))} className="mt-1 block w-full" required />
                        <InputError htmlFor="default_sets" message={errors.default_sets} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="week_starts_on" value="Week starts on" />
                        <select id="week_starts_on" value={data.week_starts_on} onChange={(e) => setData('week_starts_on', e.target.value as 'mon' | 'sun')} className={SELECT}>
                            <option value="mon">Monday</option>
                            <option value="sun">Sunday</option>
                        </select>
                        <InputError htmlFor="week_starts_on" message={errors.week_starts_on} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="default_workout_visibility" value="Who sees new workouts" />
                        <select
                            id="default_workout_visibility"
                            value={data.default_workout_visibility}
                            onChange={(e) => setData('default_workout_visibility', e.target.value as WorkoutVisibility)}
                            className={SELECT}
                            aria-describedby="visibility-hint"
                        >
                            <option value="public">Everyone</option>
                            <option value="followers">Followers</option>
                            <option value="private">Only you</option>
                        </select>
                        <p id="visibility-hint" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Pre-selected when you save a workout. You can change it each time.</p>
                        <InputError htmlFor="default_workout_visibility" message={errors.default_workout_visibility} className="mt-2" />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="timezone" value="Timezone" />
                        <select id="timezone" value={data.timezone} onChange={(e) => setData('timezone', e.target.value)} className={SELECT} required>
                            {zones(data.timezone).map((z) => (
                                <option key={z} value={z}>
                                    {z.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                        <InputError htmlFor="timezone" message={errors.timezone} className="mt-2" />
                    </div>
                </div>
                <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save settings'}</PrimaryButton>
            </form>
        </AuthenticatedLayout>
    );
}
