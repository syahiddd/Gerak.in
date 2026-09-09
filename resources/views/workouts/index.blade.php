<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-extrabold">Workout History</h1>
            <div class="flex gap-2">
                <a href="{{ route('workouts.active') }}" class="rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-bold px-4 py-2">Resume active</a>
                <form method="POST" action="{{ route('workouts.start-empty') }}">@csrf<button class="rounded-xl bg-lime-400 text-zinc-950 text-sm font-bold px-4 py-2">+ Empty workout</button></form>
            </div>
        </div>
    </x-slot>

    <form method="GET" class="flex gap-2 text-sm">
        <input type="date" name="from" value="{{ request('from') }}" class="rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" />
        <input type="date" name="to" value="{{ request('to') }}" class="rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" />
        <button class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 font-bold">Filter</button>
    </form>

    <div class="mt-4 space-y-3">
        @forelse ($workouts as $w)
            <a href="{{ route('workouts.show', $w) }}" class="block rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-lime-400">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-bold">{{ $w->name }}</p>
                        <p class="text-xs text-zinc-500">{{ $w->started_at->format('d M Y, H:i') }} · {{ $w->exercises_count }} exercises</p>
                    </div>
                    <div class="text-right text-sm tabular-nums">
                        <p class="font-bold">{{ number_format((float) $w->total_volume_kg) }} kg</p>
                        <p class="text-xs text-zinc-500">{{ $w->duration_seconds ? gmdate('H:i:s', $w->duration_seconds) : '—' }}</p>
                    </div>
                </div>
            </a>
        @empty
            <x-empty-state title="No workouts yet" hint="Your completed workouts will appear here." />
        @endforelse
    </div>
    <div class="mt-4">{{ $workouts->links() }}</div>
</x-app-layout>
