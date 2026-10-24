<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\MeasurementController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicProfileController;
use App\Http\Controllers\RecordController;
use App\Http\Controllers\RoutineController;
use App\Http\Controllers\RoutineFolderController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\UserSearchController;
use App\Http\Controllers\WorkoutCommentController;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\WorkoutLikeController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
        ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // The dashboard now lives on the profile page; keep the name for login redirects and old links.
    Route::redirect('/dashboard', '/profile')->name('dashboard');

    // Exercises
    Route::get('/exercises', [ExerciseController::class, 'index'])->name('exercises.index');
    Route::get('/exercises/create', [ExerciseController::class, 'create'])->name('exercises.create');
    Route::get('/exercises/lookup', [ExerciseController::class, 'lookup'])->name('exercises.lookup');
    Route::post('/exercises', [ExerciseController::class, 'store'])->name('exercises.store');
    Route::get('/exercises/{exercise:slug}', [ExerciseController::class, 'show'])->name('exercises.show');
    Route::get('/exercises/{exercise}/edit', [ExerciseController::class, 'edit'])->name('exercises.edit');
    Route::patch('/exercises/{exercise}', [ExerciseController::class, 'update'])->name('exercises.update');
    Route::delete('/exercises/{exercise}', [ExerciseController::class, 'destroy'])->name('exercises.destroy');

    // Routines
    Route::get('/routines', [RoutineController::class, 'index'])->name('routines.index');
    Route::get('/routines/create', [RoutineController::class, 'create'])->name('routines.create');
    Route::post('/routines', [RoutineController::class, 'store'])->name('routines.store');
    Route::get('/routines/{routine}', [RoutineController::class, 'show'])->name('routines.show');
    Route::get('/routines/{routine}/edit', [RoutineController::class, 'edit'])->name('routines.edit');
    Route::patch('/routines/{routine}', [RoutineController::class, 'update'])->name('routines.update');
    Route::delete('/routines/{routine}', [RoutineController::class, 'destroy'])->name('routines.destroy');
    Route::post('/routines/{routine}/duplicate', [RoutineController::class, 'duplicate'])->name('routines.duplicate');
    Route::post('/routines/{routine}/archive', [RoutineController::class, 'archive'])->name('routines.archive');
    Route::post('/routines/{routine}/exercises', [RoutineController::class, 'addExercise'])->name('routines.add-exercise');
    Route::patch('/routines/{routine}/exercises/{exercise}', [RoutineController::class, 'updateExercise'])->name('routines.update-exercise');
    Route::delete('/routines/{routine}/exercises/{exercise}', [RoutineController::class, 'removeExercise'])->name('routines.remove-exercise');
    Route::post('/routines/{routine}/reorder', [RoutineController::class, 'reorder'])->name('routines.reorder');

    // Routine folders
    Route::post('/routine-folders', [RoutineFolderController::class, 'store'])->name('folders.store');
    Route::patch('/routine-folders/{folder}', [RoutineFolderController::class, 'update'])->name('folders.update');
    Route::delete('/routine-folders/{folder}', [RoutineFolderController::class, 'destroy'])->name('folders.destroy');

    // Workouts
    Route::get('/workouts', [WorkoutController::class, 'index'])->name('workouts.index');
    Route::get('/workouts/active', [WorkoutController::class, 'active'])->name('workouts.active');
    Route::post('/workouts/empty', [WorkoutController::class, 'startEmpty'])->name('workouts.start-empty');
    Route::post('/workouts/from-routine/{routine}', [WorkoutController::class, 'startFromRoutine'])->name('workouts.start-routine');
    Route::get('/workouts/{workout}', [WorkoutController::class, 'show'])->name('workouts.show');
    Route::patch('/workouts/{workout}', [WorkoutController::class, 'update'])->name('workouts.update');
    Route::delete('/workouts/{workout}', [WorkoutController::class, 'destroy'])->name('workouts.destroy');
    Route::post('/workouts/{workout}/finish', [WorkoutController::class, 'finish'])->name('workouts.finish');
    Route::post('/workouts/{workout}/cancel', [WorkoutController::class, 'cancel'])->name('workouts.cancel');
    Route::post('/workouts/{workout}/pause', [WorkoutController::class, 'pause'])->name('workouts.pause');
    Route::post('/workouts/{workout}/resume', [WorkoutController::class, 'resume'])->name('workouts.resume');
    Route::post('/workouts/{workout}/exercises', [WorkoutController::class, 'addExercise'])->name('workouts.add-exercise');
    Route::patch('/workouts/{workout}/exercises/{exercise}', [WorkoutController::class, 'updateExercise'])->name('workouts.update-exercise');
    Route::delete('/workouts/{workout}/exercises/{exercise}', [WorkoutController::class, 'removeExercise'])->name('workouts.remove-exercise');
    Route::post('/workouts/{workout}/sets', [WorkoutController::class, 'storeSet'])->name('workouts.store-set');
    Route::patch('/sets/{set}', [WorkoutController::class, 'updateSet'])->name('workouts.update-set');
    Route::delete('/sets/{set}', [WorkoutController::class, 'destroySet'])->name('workouts.destroy-set');

    Route::get('/workouts/{workout}/save', [WorkoutController::class, 'save'])->name('workouts.save');

    // Social: feed, posts, likes, comments, follows, public profiles
    Route::get('/feed', [FeedController::class, 'index'])->name('feed.index');
    Route::get('/w/{workout}', [FeedController::class, 'show'])->name('posts.show');
    Route::post('/workouts/{workout}/like', [WorkoutLikeController::class, 'store'])->name('posts.like');
    Route::delete('/workouts/{workout}/like', [WorkoutLikeController::class, 'destroy'])->name('posts.unlike');
    Route::post('/workouts/{workout}/comments', [WorkoutCommentController::class, 'store'])
        ->middleware('throttle:20,1')->name('posts.comments.store');
    Route::delete('/comments/{comment}', [WorkoutCommentController::class, 'destroy'])->name('posts.comments.destroy');
    Route::get('/people', UserSearchController::class)->name('users.search');
    Route::get('/u/{user:username}', [PublicProfileController::class, 'show'])->name('users.show');
    Route::get('/u/{user:username}/followers', [PublicProfileController::class, 'followers'])->name('users.followers');
    Route::get('/u/{user:username}/following', [PublicProfileController::class, 'following'])->name('users.following');
    Route::post('/u/{user:username}/follow', [FollowController::class, 'store'])->name('users.follow');
    Route::delete('/u/{user:username}/follow', [FollowController::class, 'destroy'])->name('users.unfollow');

    // Stats / records / measurements
    Route::get('/statistics', [StatisticsController::class, 'index'])->name('statistics.index');
    Route::get('/records', [RecordController::class, 'index'])->name('records.index');
    Route::get('/measurements', [MeasurementController::class, 'index'])->name('measurements.index');
    Route::post('/measurements', [MeasurementController::class, 'store'])->name('measurements.store');
    Route::delete('/measurements/{measurement}', [MeasurementController::class, 'destroy'])->name('measurements.destroy');

    // Settings
    Route::get('/settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::patch('/settings', [SettingController::class, 'update'])->name('settings.update');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');
});

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::post('/users/{user}/suspend', [AdminController::class, 'suspend'])->name('users.suspend');
    Route::post('/users/{user}/activate', [AdminController::class, 'activate'])->name('users.activate');
    Route::get('/exercises', [AdminController::class, 'exercises'])->name('exercises');
});

require __DIR__.'/auth.php';
