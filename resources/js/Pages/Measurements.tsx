import { confirmAction } from '@/Components/ConfirmDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { btn, Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { cmToUnit, formatNumber, kgToUnit, lengthUnit, UnitSystem, unitToCm, unitToKg, useUnitSystem, weightUnit } from '@/lib/units';
import { BodyMeasurement, Paginated } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Kind = 'weight' | 'percent' | 'length';

const TYPES: { value: string; label: string; kind: Kind }[] = [
    { value: 'weight', label: 'Body weight', kind: 'weight' },
    { value: 'body_fat', label: 'Body fat', kind: 'percent' },
    { value: 'chest', label: 'Chest', kind: 'length' },
    { value: 'waist', label: 'Waist', kind: 'length' },
    { value: 'hips', label: 'Hips', kind: 'length' },
    { value: 'arm_l', label: 'Left arm', kind: 'length' },
    { value: 'arm_r', label: 'Right arm', kind: 'length' },
    { value: 'thigh_l', label: 'Left thigh', kind: 'length' },
    { value: 'thigh_r', label: 'Right thigh', kind: 'length' },
];

const kindOf = (type: string): Kind => TYPES.find((t) => t.value === type)?.kind ?? 'length';
const labelOf = (type: string) => TYPES.find((t) => t.value === type)?.label ?? type;

const unitFor = (kind: Kind, system: UnitSystem) => (kind === 'weight' ? weightUnit(system) : kind === 'percent' ? '%' : lengthUnit(system));

// Stored canonical (kg / cm); shown and typed in the user's unit.
const toShown = (value: number | string, kind: Kind, system: UnitSystem) =>
    kind === 'weight' ? kgToUnit(value, system) ?? 0 : kind === 'length' ? cmToUnit(value, system) : Number(value);
const toStored = (value: string, kind: Kind, system: UnitSystem) =>
    kind === 'weight' ? unitToKg(value, system) : kind === 'length' ? unitToCm(value, system) : Number(value);

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Measurements({
    measurements,
    chart,
}: {
    measurements: Paginated<BodyMeasurement>;
    chart: { recorded_at: string; value: number | string }[];
}) {
    const system = useUnitSystem();
    const today = new Date().toISOString().slice(0, 10);
    const { data, setData, post, processing, reset, errors, transform } = useForm({
        type: 'weight',
        value: '',
        recorded_at: today,
    });
    const kind = kindOf(data.type);
    const unit = unitFor(kind, system);

    transform((d) => ({ ...d, value: d.value === '' ? '' : toStored(d.value, kindOf(d.type), system) }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('measurements.store'), { preserveScroll: true, onSuccess: () => reset('value') });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Body measurements</h1>}>
            <Head title="Measurements" />

            <div className="grid gap-4 lg:grid-cols-3">
                <form onSubmit={submit} className="h-fit space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="font-bold">Log a measurement</h2>
                    <div>
                        <InputLabel htmlFor="type" value="What you measured" />
                        <select id="type" value={data.type} onChange={(e) => setData('type', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-500 text-base sm:text-sm dark:border-zinc-500 dark:bg-zinc-800 focus:border-lime-600 focus:ring-lime-600 dark:focus:border-lime-400 dark:focus:ring-lime-400" required>
                            {TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{`${t.label} (${unitFor(t.kind, system)})`}</option>
                            ))}
                        </select>
                        <InputError htmlFor="type" message={errors.type} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="value" value={`Value (${unit})`} />
                        <TextInput id="value" type="number" inputMode="decimal" step="0.1" min={0} value={data.value} onChange={(e) => setData('value', e.target.value)} className="mt-1 block w-full" required />
                        <InputError htmlFor="value" message={errors.value} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="recorded_at" value="Date" />
                        <TextInput id="recorded_at" type="date" max={today} value={data.recorded_at} onChange={(e) => setData('recorded_at', e.target.value)} className="mt-1 block w-full" />
                        <InputError htmlFor="recorded_at" message={errors.recorded_at} className="mt-2" />
                    </div>
                    <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save measurement'}</PrimaryButton>
                </form>

                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="font-bold">Body weight trend ({weightUnit(system)})</h2>
                        {chart.length === 0 ? (
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Log your body weight to see the trend here.</p>
                        ) : (
                            <div className="mt-2 h-48 text-zinc-500 dark:text-zinc-400">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chart.map((c) => ({ date: shortDate(c.recorded_at), value: kgToUnit(c.value, system) }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} />
                                        <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} domain={['auto', 'auto']} width={44} />
                                        <Tooltip formatter={(v) => [`${formatNumber(Number(v))} ${weightUnit(system)}`, 'Body weight']} contentStyle={{ borderRadius: 12, color: '#18181b' }} />
                                        <Line type="monotone" dataKey="value" stroke="#65a30d" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="font-bold">History</h2>
                        {measurements.data.length === 0 && (
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No measurements yet. Your logged entries appear here, newest first.</p>
                        )}
                        <ul>
                            {measurements.data.map((m) => {
                                const k = kindOf(m.type);
                                return (
                                    <li key={m.id} className="flex items-center justify-between gap-3 border-t border-zinc-100 py-2 text-sm first:border-t-0 dark:border-zinc-800">
                                        <p>
                                            <strong>{labelOf(m.type)}</strong>: <span className="tabular-nums">{formatNumber(toShown(m.value, k, system))} {unitFor(k, system)}</span>{' '}
                                            <span className="text-zinc-500 dark:text-zinc-400">· {m.recorded_at ? shortDate(m.recorded_at) : ''}</span>
                                        </p>
                                        <button
                                            type="button"
                                            className={`${btn.danger} -my-2 px-2`}
                                            aria-label={`Delete ${labelOf(m.type).toLowerCase()} entry${m.recorded_at ? ` from ${shortDate(m.recorded_at)}` : ''}`}
                                            onClick={async () => {
                                                const ok = await confirmAction({
                                                    title: `Delete this ${labelOf(m.type).toLowerCase()} entry?`,
                                                    body: 'It is removed from your history and charts.',
                                                    confirmLabel: 'Delete entry',
                                                });
                                                if (ok) router.delete(route('measurements.destroy', m.id), { preserveScroll: true });
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        <Pagination links={measurements.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
