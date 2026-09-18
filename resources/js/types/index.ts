export interface UserSettings {
    unit_system: 'metric' | 'imperial';
    theme: 'system' | 'light' | 'dark';
    default_rest_seconds: number;
    default_sets: number;
    week_starts_on: 'mon' | 'sun';
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'user' | 'admin';
    timezone: string;
    settings: UserSettings | null;
}

export interface Flash {
    success?: string | null;
    info?: string | null;
    pr_events?: { exercise: string; type: string; detail: string }[] | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash: Flash;
};

export interface Muscle {
    id: number;
    name: string;
    slug: string;
    group: string | null;
}

export interface Equipment {
    id: number;
    name: string;
    slug: string;
}

export interface Exercise {
    id: number;
    name: string;
    slug: string;
    external_id?: string | null;
    description: string | null;
    overview?: string | null;
    instructions: string | null;
    exercise_tips?: string[] | null;
    variations?: string[] | null;
    equipment_id: number | null;
    primary_muscle_id: number | null;
    secondary_muscle_ids: number[] | null;
    exercise_type: string;
    image_path: string | null;
    image_url?: string | null;
    image_urls?: Record<string, string> | null;
    gif_url?: string | null;
    video_url: string | null;
    media_source?: string | null;
    is_system: boolean;
    created_by: number | null;
    equipment?: Equipment | null;
    primary_muscle?: Muscle | null;
}

export interface RoutineTargetSet {
    id: number;
    order: number;
    target_reps_min: number | null;
    target_reps_max: number | null;
    target_weight_kg: string | number | null;
    set_type: string;
    target_rpe: string | number | null;
}

export interface RoutineExercise {
    id: number;
    exercise_id: number;
    order: number;
    notes: string | null;
    rest_seconds: number | null;
    exercise: Exercise;
    target_sets: RoutineTargetSet[];
}

export interface Routine {
    id: number;
    name: string;
    description: string | null;
    notes: string | null;
    status: 'active' | 'archived';
    folder_id: number | null;
    folder?: { id: number; name: string } | null;
    exercises?: RoutineExercise[];
    exercises_count?: number;
    created_at: string;
}

export interface RoutineFolder {
    id: number;
    name: string;
    routines: Routine[];
}

export interface WorkoutSet {
    id: number;
    order: number;
    set_type: string;
    weight_kg: string | number | null;
    reps: number | null;
    duration_s: number | null;
    distance_m: number | null;
    rpe: string | number | null;
    is_completed: boolean;
    completed_at: string | null;
}

export interface WorkoutExercise {
    id: number;
    exercise_id: number;
    order: number;
    notes: string | null;
    exercise: Exercise;
    sets: WorkoutSet[];
}

export interface Workout {
    id: number;
    name: string;
    notes: string | null;
    status: 'in_progress' | 'paused' | 'completed' | 'cancelled';
    started_at: string;
    paused_seconds_total: number;
    paused_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    total_volume_kg: string | number | null;
    exercises?: WorkoutExercise[];
    exercises_count?: number;
    routine?: { id: number; name: string } | null;
}

export interface PersonalRecord {
    id: number;
    record_type: string;
    value_primary: string | number;
    value_reps: number | null;
    achieved_at: string | null;
    exercise: Exercise;
    workout?: { id: number; name: string } | null;
}

export interface BodyMeasurement {
    id: number;
    type: string;
    value: string | number;
    recorded_at: string | null;
    notes: string | null;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
    weight_reps: 'Weight × Reps',
    bodyweight_reps: 'Bodyweight × Reps',
    weighted_bodyweight: 'Weighted Bodyweight',
    assisted_bodyweight: 'Assisted Bodyweight',
    duration: 'Duration',
    distance_duration: 'Distance + Duration',
};

export const SET_TYPE_LABELS: Record<string, string> = {
    normal: 'Normal',
    warmup: 'Warm-up',
    drop: 'Drop set',
    failure: 'Failure',
    assisted: 'Assisted',
    myo_rep: 'Myo-rep',
};
