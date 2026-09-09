<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Body Measurements</h1></x-slot>

    <div class="grid gap-4 lg:grid-cols-3">
        <form method="POST" action="{{ route('measurements.store') }}" class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 h-fit">
            @csrf
            <div>
                <x-input-label for="type" value="Type" />
                <select id="type" name="type" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" required>
                    @foreach (['weight' => 'Body weight (kg)', 'body_fat' => 'Body fat (%)', 'chest' => 'Chest (cm)', 'waist' => 'Waist (cm)', 'hips' => 'Hips (cm)', 'arm_l' => 'Left arm (cm)', 'arm_r' => 'Right arm (cm)', 'thigh_l' => 'Left thigh (cm)', 'thigh_r' => 'Right thigh (cm)'] as $v => $l)
                        <option value="{{ $v }}">{{ $l }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <x-input-label for="value" value="Value (canonical unit)" />
                <x-text-input id="value" name="value" type="number" step="0.1" min="0" class="mt-1 block w-full" required />
            </div>
            <div>
                <x-input-label for="recorded_at" value="Date" />
                <x-text-input id="recorded_at" name="recorded_at" type="date" class="mt-1 block w-full" value="{{ now()->toDateString() }}" />
            </div>
            <x-primary-button>Save measurement</x-primary-button>
        </form>

        <div class="lg:col-span-2 space-y-4">
            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <h2 class="font-bold">Body weight trend</h2>
                @if ($chart->isEmpty())
                    <p class="mt-2 text-sm text-zinc-500">Start tracking your body measurements.</p>
                @else
                    <canvas id="wChart" height="120"></canvas>
                @endif
            </div>
            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5">
                <h2 class="font-bold">History</h2>
                @forelse ($measurements as $m)
                    <div class="mt-2 flex items-center justify-between text-sm border-t border-zinc-100 dark:border-zinc-800 py-2">
                        <p><strong>{{ $m->type->label() }}</strong>: {{ $m->value }} {{ $m->type->canonicalUnit() }} <span class="text-zinc-500">· {{ $m->recorded_at?->format('d M Y') }}</span></p>
                        <form method="POST" action="{{ route('measurements.destroy', $m) }}" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="text-red-500 text-xs font-semibold">Delete</button></form>
                    </div>
                @empty
                    <p class="mt-2 text-sm text-zinc-500">No measurements yet.</p>
                @endforelse
                <div class="mt-3">{{ $measurements->links() }}</div>
            </div>
        </div>
    </div>

    @if ($chart->isNotEmpty())
    @push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
        new Chart(document.getElementById('wChart'), {
            type: 'line',
            data: { labels: @json($chart->pluck('recorded_at')), datasets: [{ data: @json($chart->pluck('value')) }] },
            options: { plugins: { legend: { display: false } } }
        });
    </script>
    @endpush
    @endif
</x-app-layout>
