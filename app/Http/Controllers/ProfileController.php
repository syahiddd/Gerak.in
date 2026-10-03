<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Services\AvatarService;
use App\Services\StatisticsService;
use App\Support\ProfileCard;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * The signed-in user's profile: header (avatar, counts, Edit profile) plus
     * the training overview that used to live on the dashboard.
     */
    public function show(Request $request, StatisticsService $stats): Response
    {
        $user = $request->user();

        $hour = (int) now()->format('G');

        return Inertia::render('Profile/Show', [
            'profile' => ProfileCard::for($user, $user),
            'overview' => $stats->overview($user),
            'weekly' => $stats->weeklyVolume($user, 8),
            'muscles' => $stats->muscleDistribution($user, 30),
            'recentWorkouts' => $user->workouts()->completed()->withCount('exercises')->latest('started_at')->limit(5)->get(),
            'activeWorkout' => $user->workouts()->active()->latest('started_at')->first(),
            'routines' => $user->routines()->where('status', 'active')->withCount('exercises')->latest()->limit(3)->get(),
            'recentPrs' => $user->personalRecords()->with('exercise')->latest('achieved_at')->limit(5)->get(),
        ]);
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'bio' => $request->user()->profile?->bio,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();

        // Bio lives on the profile row; the rest is on users.
        if (array_key_exists('bio', $data)) {
            $user->profile()->updateOrCreate(['user_id' => $user->id], ['bio' => $data['bio']]);
            unset($data['bio']);
        }

        $user->fill($data);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Replace the profile photo (stored as square WebP when possible).
     */
    public function updateAvatar(Request $request, AvatarService $avatars): RedirectResponse
    {
        $request->validate(
            // 2 MB matches PHP's default upload_max_filesize; the browser shrinks photos first.
            ['avatar' => ['required', 'image', 'mimes:webp,jpeg,png', 'max:2048']],
            ['avatar.max' => 'The photo must be 2 MB or smaller.', 'avatar.mimes' => 'Use a WebP, JPG or PNG image.'],
        );

        $avatars->update($request->user(), $request->file('avatar'));

        return back()->with('success', 'Profile photo updated.');
    }

    public function destroyAvatar(Request $request, AvatarService $avatars): RedirectResponse
    {
        $avatars->remove($request->user());

        return back()->with('success', 'Profile photo removed.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request, AvatarService $avatars): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();
        $avatars->remove($user);

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
