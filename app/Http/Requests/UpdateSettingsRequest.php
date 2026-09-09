<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Settings are always self-scoped to the authenticated user;
        // no policy needed beyond the auth middleware.
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'unit_system' => ['required', 'in:metric,imperial'],
            'theme' => ['required', 'in:system,light,dark'],
            'default_rest_seconds' => ['required', 'integer', 'min:0', 'max:3600'],
            'default_sets' => ['required', 'integer', 'min:1', 'max:20'],
            'week_starts_on' => ['required', 'in:mon,sun'],
            'timezone' => ['required', 'string', 'max:64'],
        ];
    }
}
