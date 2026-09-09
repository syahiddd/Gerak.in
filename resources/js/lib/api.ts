/** Same-origin JSON helper (session auth + CSRF). Used for set autosave so typing never triggers full page visits. */
function csrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

async function json<T>(url: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrf(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as T;
}

export const api = {
    patchSet: (id: number, payload: Record<string, unknown>) =>
        json<{ set: Record<string, unknown> }>(`/sets/${id}`, 'PATCH', payload),
    deleteSet: (id: number) => json<{ deleted: boolean }>(`/sets/${id}`, 'DELETE'),
    addSet: (workoutId: number, workoutExerciseId: number, setType = 'normal') =>
        json<{ set: Record<string, unknown> }>(`/workouts/${workoutId}/sets`, 'POST', {
            workout_exercise_id: workoutExerciseId,
            set_type: setType,
        }),
};
