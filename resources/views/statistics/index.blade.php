<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Statistics</h1></x-slot>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <x-stat-card label="Workouts" :value="$overview['total_workouts']" />
        <x-stat-card label="Volume" :value="number_format($overview['total_volume_kg']).' kg'" />
        <x-stat-card label="Sets" :value="$overview['total_sets']" />
        <x-stat-card label="Streak" :value="$overview['current_streak_days'].'d'" />
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
            <h2 class="font-bold">Volume per week (12w)</h2>
            <canvas id="volChart" height="140"></canvas>
        </div>
        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
            <h2 class="font-bold">Muscle distribution (30d)</h2>
            @if (empty($muscles['labels']))
                <p class="mt-2 text-sm text-zinc-500">Complete a workout to see your muscle split.</p>
            @else
                <canvas id="muscleChart" height="140"></canvas>
            @endif
        </div>
    </div>

    @push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
        new Chart(document.getElementById('volChart'), {
            type: 'bar',
            data: { labels: @json($weekly['labels']), datasets: [{ data: @json($weekly['volumes']), backgroundColor: '#a3e635' }] },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
        @if (!empty($muscles['labels']))
        new Chart(document.getElementById('muscleChart'), {
            type: 'doughnut',
            data: { labels: @json($muscles['labels']), datasets: [{ data: @json($muscles['sets']) }] },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
        @endif
    </script>
    @endpush
</x-app-layout>
