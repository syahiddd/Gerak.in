import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { applyTheme } from '@/hooks/workout';
import { User, UserSettings } from '@/types';
import { Head, useForm } from '@inertiajs/react';

export default function Settings({ user, settings }: { user: User; settings: UserSettings }) {
    const { data, setData, patch, processing } = useForm({
        unit_system: settings.unit_system,
        theme: settings.theme,
        default_rest_seconds: settings.default_rest_seconds,
        default_sets: settings.default_sets,
        week_starts_on: settings.week_starts_on,
        timezone: user.timezone,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('settings.update'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Settings</h1>}>
            <Head title="Settings" />

            <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="unit_system" value="Unit system" />
                        <select id="unit_system" value={data.unit_system} onChange={(e) => setData('unit_system', e.target.value as 'metric' | 'imperial')} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                            <option value="metric">Metric (kg / cm)</option>
                            <option value="imperial">Imperial (lb / in)</option>
                        </select>
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
                            className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                        >
                            <option value="system">System</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="default_rest_seconds" value="Default rest (seconds)" />
                        <TextInput id="default_rest_seconds" type="number" min={0} max={3600} value={data.default_rest_seconds} onChange={(e) => setData('default_rest_seconds', Number(e.target.value))} className="mt-1 block w-full" required />
                    </div>
                    <div>
                        <InputLabel htmlFor="default_sets" value="Default sets" />
                        <TextInput id="default_sets" type="number" min={1} max={20} value={data.default_sets} onChange={(e) => setData('default_sets', Number(e.target.value))} className="mt-1 block w-full" required />
                    </div>
                    <div>
                        <InputLabel htmlFor="week_starts_on" value="Week starts on" />
                        <select id="week_starts_on" value={data.week_starts_on} onChange={(e) => setData('week_starts_on', e.target.value as 'mon' | 'sun')} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                            <option value="mon">Monday</option>
                            <option value="sun">Sunday</option>
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="timezone" value="Timezone" />
                        <TextInput id="timezone" value={data.timezone} onChange={(e) => setData('timezone', e.target.value)} className="mt-1 block w-full" required />
                    </div>
                </div>
                <PrimaryButton disabled={processing}>Save settings</PrimaryButton>
            </form>
        </AuthenticatedLayout>
    );
}
