<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoutineExerciseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'exercise_id' => ['required', 'integer', 'exists:exercises,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'rest_seconds' => ['nullable', 'integer', 'min:0', 'max:3600'],
            'superset_group' => ['nullable', 'string', 'max:20'],
        ];
    }
}
