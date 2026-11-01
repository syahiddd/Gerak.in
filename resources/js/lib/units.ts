import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

/** Mirrors App\Support\UnitConverter (canonical storage kg/cm). */
export type UnitSystem = 'metric' | 'imperial';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export function kgToLb(kg: number): number {
    return kg / KG_PER_LB;
}

/** The signed-in user's unit setting. Storage stays kg/cm; only what is shown and typed changes. */
export function useUnitSystem(): UnitSystem {
    return usePage<PageProps>().props.auth?.user?.settings?.unit_system ?? 'metric';
}

export const weightUnit = (system: UnitSystem) => (system === 'imperial' ? 'lb' : 'kg');
export const lengthUnit = (system: UnitSystem) => (system === 'imperial' ? 'in' : 'cm');

/** kg -> the user's unit, rounded for display and for pre-filling inputs. */
export function kgToUnit(kg: number | string | null | undefined, system: UnitSystem): number | null {
    if (kg === null || kg === undefined || kg === '') return null;
    const n = Number(kg);
    return Math.round((system === 'imperial' ? n / KG_PER_LB : n) * 10) / 10;
}

/** A value typed in the user's unit -> kg for the API, at the DB's 2-decimal precision. */
export function unitToKg(value: number | string, system: UnitSystem): number {
    const n = Number(value);
    return Math.round((system === 'imperial' ? n * KG_PER_LB : n) * 100) / 100;
}

export function cmToUnit(cm: number | string, system: UnitSystem): number {
    const n = Number(cm);
    return Math.round((system === 'imperial' ? n / CM_PER_IN : n) * 10) / 10;
}

export function unitToCm(value: number | string, system: UnitSystem): number {
    const n = Number(value);
    return Math.round((system === 'imperial' ? n * CM_PER_IN : n) * 100) / 100;
}

/** "77.5 kg" / "170.9 lb"; "-" when there is no value. */
export function formatWeight(kg: number | string | null | undefined, system: UnitSystem): string {
    const v = kgToUnit(kg, system);
    return v === null ? '-' : `${formatNumber(v)} ${weightUnit(system)}`;
}

export function displayWeight(
    kg: number | string | null | undefined,
    system: UnitSystem,
): { value: number | string; unit: string } {
    if (kg === null || kg === undefined || kg === '') return { value: '-', unit: '' };
    const n = Number(kg);
    if (system === 'imperial') {
        return { value: Math.round(kgToLb(n) * 10) / 10, unit: 'lb' };
    }
    return { value: Math.round(n * 10) / 10, unit: 'kg' };
}

export function formatDuration(totalSeconds: number | null | undefined): string {
    if (totalSeconds === null || totalSeconds === undefined) return '-';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';
    return Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 });
}

const SET_TYPE_SHORT: Record<string, string> = {
    normal: 'N',
    warmup: 'W',
    drop: 'D',
    failure: 'F',
    assisted: 'A',
    myo_rep: 'M',
};

/** Normal sets are numbered among themselves; other types show their letter (W, D, F...). */
export function setLabel(sets: { set_type: string }[], i: number): string | number {
    const type = sets[i].set_type;
    if (type === 'normal') return sets.slice(0, i + 1).filter((s) => s.set_type === 'normal').length;
    return SET_TYPE_SHORT[type] ?? type;
}

/** A personal record's headline value, in the user's units. */
export function formatRecord(
    pr: { record_type: string; value_primary: number | string; value_reps: number | null },
    system: UnitSystem,
): string {
    const v = Number(pr.value_primary);
    switch (pr.record_type) {
        case 'most_reps':
            return `${formatNumber(v)} reps`;
        case 'best_duration':
            return formatDuration(v);
        case 'longest_distance':
            return `${formatNumber(v)} m`;
        case 'heaviest_weight':
            return formatWeight(v, system) + (pr.value_reps ? ` × ${pr.value_reps}` : '');
        default:
            return formatWeight(v, system);
    }
}
