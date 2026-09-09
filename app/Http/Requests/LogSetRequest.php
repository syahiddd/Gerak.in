<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LogSetRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:2000'],
            'reps' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'duration_s' => ['nullable', 'integer', 'min:0', 'max:86400'],
            'distance_m' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'rpe' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'set_type' => ['sometimes', 'string', 'in:normal,warmup,drop,failure,assisted,myo_rep'],
            'is_completed' => ['sometimes', 'boolean'],
        ];
    }
}
