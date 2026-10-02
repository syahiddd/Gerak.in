<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FollowController extends Controller
{
    public function store(Request $request, User $user): RedirectResponse
    {
        $me = $request->user();
        if ($me->is($user)) {
            throw ValidationException::withMessages(['follow' => 'You cannot follow yourself.']);
        }
        abort_if($user->is_suspended, 404);

        $me->following()->syncWithoutDetaching([$user->id]);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $request->user()->following()->detach($user->id);

        return back();
    }
}
