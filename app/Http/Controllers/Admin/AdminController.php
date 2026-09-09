<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Models\User;
use App\Models\Workout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function dashboard(): View
    {
        return view('admin.dashboard', [
            'totalUsers' => User::count(),
            'activeUsers' => User::where('is_suspended', false)->count(),
            'totalWorkouts' => Workout::count(),
            'completedWorkouts' => Workout::where('status', 'completed')->count(),
            'totalExercises' => Exercise::count(),
            'customExercises' => Exercise::where('is_system', false)->count(),
            'recentUsers' => User::latest()->limit(8)->get(),
        ]);
    }

    public function users(Request $request): View
    {
        $q = User::query()->latest();
        if ($request->filled('q')) {
            $q->where(fn ($w) => $w->where('name', 'like', '%'.$request->q.'%')->orWhere('email', 'like', '%'.$request->q.'%'));
        }

        return view('admin.users', ['users' => $q->paginate(20)->withQueryString()]);
    }

    public function suspend(User $user): RedirectResponse
    {
        $user->update(['is_suspended' => true]);

        return back()->with('success', "Suspended {$user->email}.");
    }

    public function activate(User $user): RedirectResponse
    {
        $user->update(['is_suspended' => false]);

        return back()->with('success', "Activated {$user->email}.");
    }

    public function exercises(Request $request): View
    {
        $q = Exercise::with(['primaryMuscle'])->latest();
        if ($request->filled('q')) {
            $q->where('name', 'like', '%'.$request->q.'%');
        }

        return view('admin.exercises', ['exercises' => $q->paginate(20)->withQueryString()]);
    }
}
