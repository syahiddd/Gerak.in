<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoutineExerciseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:1000'],
            'rest_seconds' => ['nullable', 'integer', 'min:0', 'max:3600'],
            'superset_group' => ['nullable', 'string', 'max:20'],
            'sets' => ['sometimes', 'array', 'max:30'],
            'sets.*.target_reps_min' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'sets.*.target_reps_max' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'sets.*.target_weight_kg' => ['nullable', 'numeric', 'min:0', 'max:2000'],
            'sets.*.target_duration_s' => ['nullable', 'integer', 'min:0', 'max:86400'],
            'sets.*.target_distance_m' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'sets.*.set_type' => ['nullable', 'string', 'in:normal,warmup,drop,failure,assisted,myo_rep'],
            'sets.*.target_rpe' => ['nullable', 'numeric', 'min:0', 'max:10'],
        ];
    }
}
