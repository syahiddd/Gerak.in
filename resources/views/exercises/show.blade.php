<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">{{ $exercise->name }}</h1></x-slot>

    <div class="grid gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <div class="rounded-xl bg-zinc-100 dark:bg-zinc-800 h-40 flex items-center justify-center text-zinc-400 text-sm">Demonstration media placeholder</div>
                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                    <span class="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 font-semibold">{{ $exercise->exercise_type->label() }}</span>
                    <span class="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1">{{ $exercise->primaryMuscle?->name ?? '—' }}</span>
                    <span class="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1">{{ $exercise->equipment?->name ?? '—' }}</span>
                </div>
                @if ($exercise->description)<p class="mt-3 text-sm">{{ $exercise->description }}</p>@endif
                @if ($exercise->instructions)<p class="mt-2 text-sm text-zinc-500 whitespace-pre-line">{{ $exercise->instructions }}</p>@endif
                @can('update', $exercise)
                    <a href="{{ route('exercises.edit', $exercise) }}" class="mt-3 inline-block rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-bold px-4 py-2">Edit</a>
                @endcan
            </div>

            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <h2 class="font-bold">History</h2>
                @if ($history->isEmpty())
                    <p class="mt-2 text-sm text-zinc-500">Complete a workout to see your progress.</p>
                @else
                    <canvas id="exChart" height="120"></canvas>
                @endif
            </div>
        </div>

        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <x-stat-card label="Best set" :value="$bestSet ? $bestSet->weight_kg.' × '.$bestSet->reps : '—'" />
                <x-stat-card label="1RM (est.)" :value="$oneRm ?? '—'" sub="Epley, estimate only" />
            </div>
            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <h2 class="font-bold">Personal records</h2>
                @forelse ($prs as $pr)
                    <p class="mt-2 text-sm"><strong>{{ $pr->record_type->label() }}</strong>: {{ $pr->value_primary }}{{ $pr->value_reps ? ' × '.$pr->value_reps : '' }}</p>
                @empty
                    <p class="mt-2 text-sm text-zinc-500">No PRs for this exercise yet.</p>
                @endforelse
            </div>
        </div>
    </div>

    @if ($history->isNotEmpty())
    @push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
        new Chart(document.getElementById('exChart'), {
            type: 'line',
            data: { labels: @json($history->pluck('date')), datasets: [{ label: 'Max weight', data: @json($history->pluck('max_w')) }] },
            options: { plugins: { legend: { display: false } } }
        });
    </script>
    @endpush
    @endif
</x-app-layout>
