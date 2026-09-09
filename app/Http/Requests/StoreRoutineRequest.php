<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoutineRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'folder_id' => ['nullable', 'integer', 'exists:routine_folders,id'],
            'exercises' => ['sometimes', 'array'],
            'exercises.*.exercise_id' => ['required', 'integer', 'exists:exercises,id'],
            'exercises.*.notes' => ['nullable', 'string', 'max:1000'],
            'exercises.*.rest_seconds' => ['nullable', 'integer', 'min:0', 'max:3600'],
            'exercises.*.sets' => ['sometimes', 'array', 'max:30'],
            'exercises.*.sets.*.target_reps_min' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'exercises.*.sets.*.target_reps_max' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'exercises.*.sets.*.target_weight_kg' => ['nullable', 'numeric', 'min:0', 'max:2000'],
            'exercises.*.sets.*.set_type' => ['nullable', 'string', 'in:normal,warmup,drop,failure,assisted,myo_rep'],
        ];
    }
}
