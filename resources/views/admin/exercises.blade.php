<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Admin — Exercises</h1></x-slot>

    <form method="GET" class="flex gap-2 max-w-md">
        <x-text-input name="q" placeholder="Search exercises…" value="{{ request('q') }}" class="block w-full" />
        <x-primary-button>Search</x-primary-button>
    </form>

    <div class="mt-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
        @foreach ($exercises as $ex)
            <div class="p-4 text-sm">
                <p class="font-bold">{{ $ex->name }}</p>
                <p class="text-zinc-500">{{ $ex->slug }} · {{ $ex->primaryMuscle?->name ?? '—' }} · {{ $ex->is_system ? 'system' : 'custom' }}</p>
            </div>
        @endforeach
    </div>
    <div class="mt-4">{{ $exercises->links() }}</div>
</x-app-layout>
