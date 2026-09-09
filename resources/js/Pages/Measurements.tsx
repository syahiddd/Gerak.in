import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { BodyMeasurement, Paginated } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const TYPES = [
    { value: 'weight', label: 'Body weight (kg)' },
    { value: 'body_fat', label: 'Body fat (%)' },
    { value: 'chest', label: 'Chest (cm)' },
    { value: 'waist', label: 'Waist (cm)' },
    { value: 'hips', label: 'Hips (cm)' },
    { value: 'arm_l', label: 'Left arm (cm)' },
    { value: 'arm_r', label: 'Right arm (cm)' },
    { value: 'thigh_l', label: 'Left thigh (cm)' },
    { value: 'thigh_r', label: 'Right thigh (cm)' },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

export default function Measurements({
    measurements,
    chart,
}: {
    measurements: Paginated<BodyMeasurement>;
    chart: { recorded_at: string; value: number | string }[];
}) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, setData, post, processing, reset } = useForm({
        type: 'weight',
        value: '',
        recorded_at: today,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('measurements.store'), { onSuccess: () => reset('value') });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Body Measurements</h1>}>
            <Head title="Measurements" />

            <div className="grid gap-4 lg:grid-cols-3">
                <form onSubmit={submit} className="h-fit space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div>
                        <InputLabel htmlFor="type" value="Type" />
                        <select id="type" value={data.type} onChange={(e) => setData('type', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" required>
                            {TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="value" value="Value (canonical unit)" />
                        <TextInput id="value" type="number" step="0.1" min={0} value={data.value} onChange={(e) => setData('value', e.target.value)} className="mt-1 block w-full" required />
                    </div>
                    <div>
                        <InputLabel htmlFor="recorded_at" value="Date" />
                        <TextInput id="recorded_at" type="date" value={data.recorded_at} onChange={(e) => setData('recorded_at', e.target.value)} className="mt-1 block w-full" />
                    </div>
                    <PrimaryButton disabled={processing}>Save measurement</PrimaryButton>
                </form>

                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="font-bold">Body weight trend</h2>
                        {chart.length === 0 ? (
                            <p className="mt-2 text-sm text-zinc-500">Start tracking your body measurements.</p>
                        ) : (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chart.map((c) => ({ date: new Date(c.recorded_at).toLocaleDateString(), value: Number(c.value) }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="value" stroke="#a3e635" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="font-bold">History</h2>
                        {measurements.data.length === 0 && (
                            <p className="mt-2 text-sm text-zinc-500">No measurements yet.</p>
                        )}
                        {measurements.data.map((m) => (
                            <div key={m.id} className="flex items-center justify-between border-t border-zinc-100 py-2 text-sm first:border-t-0 dark:border-zinc-800">
                                <p>
                                    <strong>{TYPE_LABELS[m.type] ?? m.type}</strong>: {String(m.value)}{' '}
                                    <span className="text-zinc-500">· {m.recorded_at ? new Date(m.recorded_at).toLocaleDateString() : ''}</span>
                                </p>
                                <Link
                                    href={route('measurements.destroy', m.id)}
                                    method="delete"
                                    as="button"
                                    className="text-xs font-semibold text-red-500"
                                    onBefore={() => confirm('Delete?')}
                                >
                                    Delete
                                </Link>
                            </div>
                        ))}
                        <Pagination links={measurements.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
