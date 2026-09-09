<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Edit: {{ $routine->name }}</h1></x-slot>

    <form method="POST" action="{{ route('routines.update', $routine) }}" class="max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        @csrf @method('PATCH')
        <div>
            <x-input-label for="name" value="Routine name" />
            <x-text-input id="name" name="name" class="mt-1 block w-full" required value="{{ old('name', $routine->name) }}" />
        </div>
        <div>
            <x-input-label for="folder_id" value="Folder" />
            <select id="folder_id" name="folder_id" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
                <option value="">Ungrouped</option>
                @foreach ($folders as $f)<option value="{{ $f->id }}" @selected($routine->folder_id == $f->id)>{{ $f->name }}</option>@endforeach
            </select>
        </div>
        <div>
            <x-input-label for="description" value="Description" />
            <textarea id="description" name="description" rows="2" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">{{ old('description', $routine->description) }}</textarea>
        </div>
        <x-primary-button>Save</x-primary-button>
    </form>
</x-app-layout>
