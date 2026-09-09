/** Mirrors App\Support\UnitConverter (canonical storage kg/cm). */
export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export function kgToLb(kg: number): number {
    return kg / KG_PER_LB;
}

export function displayWeight(
    kg: number | string | null | undefined,
    system: 'metric' | 'imperial',
): { value: number | string; unit: string } {
    if (kg === null || kg === undefined || kg === '') return { value: '—', unit: '' };
    const n = Number(kg);
    if (system === 'imperial') {
        return { value: Math.round(kgToLb(n) * 10) / 10, unit: 'lb' };
    }
    return { value: Math.round(n * 10) / 10, unit: 'kg' };
}

export function formatDuration(totalSeconds: number | null | undefined): string {
    if (totalSeconds === null || totalSeconds === undefined) return '—';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '—';
    return Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 });
}
