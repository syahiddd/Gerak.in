import { formatNumber } from '@/lib/units';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Period = 'week' | 'month';

/** "2026-40" (ISO week) -> "Sep 29" (its Monday); "2026-09" (month) -> "Sep". */
function formatPeriod(label: string, period: Period): string {
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
    const data = labels.map((label, i) => ({ period: formatPeriod(label, period), volume: volumes[i] ?? 0 }));
    // Axis text inherits the wrapper colour, so it stays readable in both themes.
    const tick = { fontSize: 11, fill: 'currentColor' };

    return (
        <div className={`text-zinc-500 dark:text-zinc-400 ${className}`}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis dataKey="period" tick={tick} />
                    <YAxis tick={tick} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                    <Tooltip formatter={(v) => [`${formatNumber(Number(v))} kg`, 'Volume']} cursor={{ fill: 'rgba(163, 230, 53, 0.15)' }} />
                    <Bar dataKey="volume" fill="#a3e635" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
