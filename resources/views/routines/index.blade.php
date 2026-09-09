<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-extrabold">Routines</h1>
            <a href="{{ route('routines.create') }}" class="rounded-xl bg-lime-400 text-zinc-950 text-sm font-bold px-4 py-2">+ New routine</a>
        </div>
    </x-slot>

    <form method="POST" action="{{ route('folders.store') }}" class="flex gap-2 max-w-md">
        @csrf
        <x-text-input name="name" placeholder="New folder (e.g. PPL)" class="block w-full" required />
        <x-primary-button>Create</x-primary-button>
    </form>

    @foreach ($folders as $folder)
        <div class="mt-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
            <div class="flex items-center justify-between">
                <h2 class="font-bold">{{ $folder->name }}</h2>
                <form method="POST" action="{{ route('folders.destroy', $folder) }}" onsubmit="return confirm('Delete folder? Routines become ungrouped.')">
                    @csrf @method('DELETE')
                    <button class="text-xs text-red-500 font-semibold">Delete</button>
                </form>
            </div>
            <div class="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                @forelse ($folder->routines as $r)
                    <a href="{{ route('routines.show', $r) }}" class="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-lime-400">
                        <p class="font-bold">{{ $r->name }}</p>
                        <p class="text-xs text-zinc-500">{{ $r->exercises_count }} exercises</p>
                    </a>
                @empty
                    <p class="text-sm text-zinc-500">Empty folder.</p>
                @endforelse
            </div>
        </div>
    @endforeach

    <div class="mt-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 class="font-bold">Ungrouped</h2>
        <div class="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            @forelse ($ungrouped as $r)
                <a href="{{ route('routines.show', $r) }}" class="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-lime-400">
                    <p class="font-bold">{{ $r->name }}</p>
                    <p class="text-xs text-zinc-500">{{ $r->exercises_count }} exercises</p>
                </a>
            @empty
                <p class="text-sm text-zinc-500">Nothing here.</p>
            @endforelse
        </div>
    </div>
</x-app-layout>
