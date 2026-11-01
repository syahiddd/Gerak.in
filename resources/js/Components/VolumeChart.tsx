import { formatNumber, kgToUnit, useUnitSystem, weightUnit } from '@/lib/units';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Period = 'week' | 'month';

/** "2026-40" (ISO week) -> "Sep 29" (its Monday); "2026-09" (month) -> "Sep". */
export function formatPeriod(label: string, period: Period): string {
    const [year, n] = label.split('-').map(Number);
    if (!year || !n) return label;
    if (period === 'month') {
        return new Date(Date.UTC(year, n - 1, 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    }
    // Jan 4 is always in ISO week 1; walk back to that week's Monday, then forward.
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * 864e5 + (n - 1) * 7 * 864e5);
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function VolumeChart({
    labels,
    volumes,
    period,
    className = 'h-56',
}: {
    labels: string[];
    volumes: number[];
    period: Period;
    className?: string;
}) {
    const system = useUnitSystem();
    const unit = weightUnit(system);
    const data = labels.map((label, i) => ({ period: formatPeriod(label, period), volume: kgToUnit(volumes[i] ?? 0, system) ?? 0 }));
    const total = data.reduce((sum, d) => sum + d.volume, 0);
    // Axis text inherits the wrapper colour, so it stays readable in both themes.
    const tick = { fontSize: 11, fill: 'currentColor' };

    return (
        // The bars are drawn in SVG, so give screen readers the same numbers as a sentence.
        <div
            role="img"
            aria-label={`Volume per ${period}: ${data.map((d) => `${d.period} ${formatNumber(d.volume)} ${unit}`).join(', ')}. Total ${formatNumber(total)} ${unit}.`}
            className={`text-zinc-500 dark:text-zinc-400 ${className}`}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis dataKey="period" tick={tick} />
                    <YAxis tick={tick} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                    <Tooltip formatter={(v) => [`${formatNumber(Number(v))} ${unit}`, 'Volume']} cursor={{ fill: 'rgba(163, 230, 53, 0.15)' }} contentStyle={{ borderRadius: 12, color: '#18181b' }} />
                    <Bar dataKey="volume" fill="#a3e635" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
