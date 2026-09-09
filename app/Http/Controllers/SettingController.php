<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingsRequest;
use Illuminate\Http\RedirectResponse;
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

    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = auth()->user();
        $user->update(['timezone' => $data['timezone']]);
        unset($data['timezone']);
        $user->settings()->updateOrCreate(['user_id' => $user->id], $data);

        return back()->with('success', 'Settings saved.');
    }
}
