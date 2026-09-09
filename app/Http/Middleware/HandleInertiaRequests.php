<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'timezone' => $user->timezone,
                    'settings' => $user->settings ? [
                        'unit_system' => $user->settings->unit_system->value,
                        'theme' => $user->settings->theme,
                        'default_rest_seconds' => $user->settings->default_rest_seconds,
                        'default_sets' => $user->settings->default_sets,
                        'week_starts_on' => $user->settings->week_starts_on,
                    ] : null,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'info' => fn () => $request->session()->get('info'),
                'pr_events' => fn () => $request->session()->get('pr_events'),
            ],
        ];
    }
}
