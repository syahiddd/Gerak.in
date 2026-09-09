<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Admin Dashboard</h1></x-slot>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <x-stat-card label="Total users" :value="$totalUsers" />
        <x-stat-card label="Completed workouts" :value="$completedWorkouts" sub="of {$totalWorkouts} total" />
        <x-stat-card label="Exercises" :value="$totalExercises" sub="{$customExercises} custom" />
        <x-stat-card label="Active users" :value="$activeUsers" />
    </div>

    <div class="mt-4 flex gap-2 text-sm">
        <a href="{{ route('admin.users') }}" class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 font-bold">Manage users</a>
        <a href="{{ route('admin.exercises') }}" class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 font-bold">Manage exercises</a>
    </div>

    <div class="mt-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 class="font-bold">Recent registrations</h2>
        @foreach ($recentUsers as $u)
            <p class="mt-1 text-sm">{{ $u->name }} · {{ $u->email }} · {{ $u->created_at->diffForHumans() }}</p>
        @endforeach
    </div>
</x-app-layout>
