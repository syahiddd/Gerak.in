<x-app-layout>
    <x-slot name="header">
        <h1 class="text-xl font-extrabold">{{ $greeting }}, {{ auth()->user()->name }}</h1>
        <p class="text-sm text-zinc-500">What are we training today?</p>
    </x-slot>

    @if ($activeWorkout)
        <div class="mb-4 rounded-2xl bg-lime-400 text-zinc-950 p-4 flex items-center justify-between">
            <div>
                <p class="font-extrabold">Resume workout: {{ $activeWorkout->name }}</p>
                <p class="text-sm">Started {{ $activeWorkout->started_at->diffForHumans() }}</p>
            </div>
            <a href="{{ route('workouts.show', $activeWorkout) }}" class="rounded-xl bg-zinc-950 text-white text-sm font-bold px-4 py-2">Resume</a>
        </div>
    @endif

    <div class="grid gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <h2 class="font-bold">Today's workout</h2>
                @if ($routines->isNotEmpty())
                    @php($r = $routines->first())
                    <p class="mt-2 font-extrabold text-lg">{{ $r->name }}</p>
                    <p class="text-sm text-zinc-500">{{ $r->exercises_count }} exercises</p>
                    <div class="mt-3 flex gap-2">
                        <form method="POST" action="{{ route('workouts.start-routine', $r) }}">@csrf
                            <button class="rounded-xl bg-lime-400 text-zinc-950 text-sm font-bold px-4 py-2">Start Workout</button>
                        </form>
                        <a href="{{ route('routines.show', $r) }}" class="rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-bold px-4 py-2">View</a>
                    </div>
                @else
                    <x-empty-state title="No routines yet" hint="Create your first routine to get going.">
                        <x-slot name="action"><a href="{{ route('routines.create') }}" class="rounded-xl bg-lime-400 text-zinc-950 text-sm font-bold px-4 py-2">Create routine</a></x-slot>
                    </x-empty-state>
                @endif
                <div class="mt-4 flex flex-wrap gap-2 text-sm">
                    <form method="POST" action="{{ route('workouts.start-empty') }}">@csrf<button class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 font-semibold">Start empty workout</button></form>
                    <a href="{{ route('exercises.index') }}" class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 font-semibold">Browse exercises</a>
                    <a href="{{ route('measurements.index') }}" class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 font-semibold">Add measurement</a>
                </div>
            </div>

            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <div class="flex items-center justify-between">
                    <h2 class="font-bold">Recent workouts</h2>
                    <a href="{{ route('workouts.index') }}" class="text-sm font-semibold text-lime-600 dark:text-lime-400">History</a>
                </div>
                @forelse ($recentWorkouts as $w)
                    <a href="{{ route('workouts.show', $w) }}" class="mt-3 flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <div>
                            <p class="font-bold">{{ $w->name }}</p>
                            <p class="text-xs text-zinc-500">{{ $w->started_at->format('d M Y, H:i') }} · {{ $w->exercises_count }} exercises</p>
                        </div>
                        <div class="text-right text-sm tabular-nums">
                            <p class="font-bold">{{ number_format((float) $w->total_volume_kg) }} kg</p>
                            <p class="text-xs text-zinc-500">{{ $w->duration_seconds ? gmdate('H:i:s', $w->duration_seconds) : '—' }}</p>
                        </div>
                    </a>
                @empty
                    <div class="mt-3"><x-empty-state title="No workouts yet" hint="Your completed workouts will appear here." /></div>
                @endforelse
            </div>

            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <h2 class="font-bold">Weekly activity</h2>
                <canvas id="weeklyChart" height="120" aria-label="Weekly volume chart"></canvas>
            </div>
        </div>

        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <x-stat-card label="Workouts" :value="$overview['total_workouts']" />
                <x-stat-card label="Volume" :value="number_format($overview['total_volume_kg']).' kg'" />
                <x-stat-card label="Sets" :value="$overview['total_sets']" />
                <x-stat-card label="Streak" :value="$overview['current_streak_days'].'d'" />
            </div>

            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <h2 class="font-bold">Muscle distribution (30d)</h2>
                @if (empty($muscles['labels']))
                    <p class="mt-2 text-sm text-zinc-500">Complete a workout to see your muscle split.</p>
                @else
                    <canvas id="muscleChart" height="160" aria-label="Muscle distribution chart"></canvas>
                @endif
            </div>

            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <div class="flex items-center justify-between">
                    <h2 class="font-bold">Recent PRs</h2>
                    <a href="{{ route('records.index') }}" class="text-sm font-semibold text-lime-600 dark:text-lime-400">All</a>
                </div>
                @forelse ($recentPrs as $pr)
                    <div class="mt-2 text-sm">
                        <p class="font-bold">{{ $pr->exercise->name }}</p>
                        <p class="text-zinc-500">{{ $pr->record_type->label() }}: {{ $pr->value_primary }}{{ $pr->value_reps ? ' × '.$pr->value_reps : '' }}</p>
                    </div>
                @empty
                    <p class="mt-2 text-sm text-zinc-500">No PRs yet. Finish a workout to set one.</p>
                @endforelse
            </div>
        </div>
    </div>

    @push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
        const weekly = @json($weekly);
        new Chart(document.getElementById('weeklyChart'), {
            type: 'bar',
            data: { labels: weekly.labels, datasets: [{ data: weekly.volumes, backgroundColor: '#a3e635' }] },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
        @if (!empty($muscles['labels']))
        const muscles = @json($muscles);
        new Chart(document.getElementById('muscleChart'), {
            type: 'doughnut',
            data: { labels: muscles.labels, datasets: [{ data: muscles.sets }] },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
        @endif
    </script>
    @endpush
</x-app-layout>
