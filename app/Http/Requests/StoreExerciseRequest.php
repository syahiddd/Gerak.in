<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExerciseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'equipment_id' => ['nullable', 'integer', 'exists:equipment,id'],
            'primary_muscle_id' => ['nullable', 'integer', 'exists:muscles,id'],
            'secondary_muscle_ids' => ['nullable', 'array'],
            'secondary_muscle_ids.*' => ['integer', 'exists:muscles,id'],
            'exercise_type' => ['required', 'string', 'in:weight_reps,bodyweight_reps,weighted_bodyweight,assisted_bodyweight,duration,distance_duration'],
            'video_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
