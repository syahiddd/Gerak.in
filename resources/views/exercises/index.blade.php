<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Exercise Library</h1></x-slot>

    <form method="GET" class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 grid gap-3 sm:grid-cols-5">
        <input type="search" name="q" value="{{ $filters['q'] ?? '' }}" placeholder="Search exercises…" class="sm:col-span-2 rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" />
        <select name="muscle" class="rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
            <option value="">All muscles</option>
            @foreach ($muscles as $m)<option value="{{ $m->id }}" @selected(($filters['muscle'] ?? '') == $m->id)>{{ $m->name }}</option>@endforeach
        </select>
        <select name="equipment" class="rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
            <option value="">All equipment</option>
            @foreach ($equipment as $e)<option value="{{ $e->id }}" @selected(($filters['equipment'] ?? '') == $e->id)>{{ $e->name }}</option>@endforeach
        </select>
        <div class="flex gap-2">
            <button class="rounded-xl bg-lime-400 text-zinc-950 text-sm font-bold px-4 py-2">Filter</button>
            <a href="{{ route('exercises.create') }}" class="rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-bold px-4 py-2">+ Custom</a>
        </div>
    </form>

    @if ($exercises->isEmpty())
        <div class="mt-4"><x-empty-state title="No exercises found" hint="Try a different search or create a custom exercise." /></div>
    @else
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($exercises as $ex)
                <a href="{{ route('exercises.show', $ex->slug) }}" class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-lime-400">
                    <p class="font-bold">{{ $ex->name }}</p>
                    <p class="mt-1 text-xs text-zinc-500">{{ $ex->exercise_type->label() }} · {{ $ex->primaryMuscle?->name ?? '—' }} · {{ $ex->equipment?->name ?? '—' }}</p>
                    @if (!$ex->is_system)<p class="mt-1 text-xs font-semibold text-lime-600 dark:text-lime-400">Custom</p>@endif
                </a>
            @endforeach
        </div>
        <div class="mt-4">{{ $exercises->links() }}</div>
    @endif
</x-app-layout>
