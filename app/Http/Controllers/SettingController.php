<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        $user = auth()->user();
        $settings = $user->settings ?? $user->settings()->create([]);

        return Inertia::render('Settings', compact('user', 'settings'));
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'unit_system' => ['required', 'in:metric,imperial'],
            'theme' => ['required', 'in:system,light,dark'],
            'default_rest_seconds' => ['required', 'integer', 'min:0', 'max:3600'],
            'default_sets' => ['required', 'integer', 'min:1', 'max:20'],
            'week_starts_on' => ['required', 'in:mon,sun'],
            'timezone' => ['required', 'string', 'max:64'],
        ]);

        $user = auth()->user();
        $user->update(['timezone' => $data['timezone']]);
        unset($data['timezone']);
        $user->settings()->updateOrCreate(['user_id' => $user->id], $data);

        return back()->with('success', 'Settings saved.');
    }
}
