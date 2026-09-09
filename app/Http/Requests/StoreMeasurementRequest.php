<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMeasurementRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['weight', 'body_fat', 'chest', 'waist', 'hips', 'arm_l', 'arm_r', 'thigh_l', 'thigh_r'])],
            'value' => ['required', 'numeric', 'min:0', 'max:10000'],
            'recorded_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
