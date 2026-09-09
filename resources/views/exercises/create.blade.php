<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">New custom exercise</h1></x-slot>

    <form method="POST" action="{{ route('exercises.store') }}" class="max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        @csrf
        <div>
            <x-input-label for="name" value="Name" />
            <x-text-input id="name" name="name" class="mt-1 block w-full" required value="{{ old('name') }}" />
        </div>
        <div class="grid sm:grid-cols-3 gap-3">
            <div>
                <x-input-label for="exercise_type" value="Type" />
                <select id="exercise_type" name="exercise_type" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" required>
                    @foreach ($types as $t)<option value="{{ $t->value }}">{{ $t->label() }}</option>@endforeach
                </select>
            </div>
            <div>
                <x-input-label for="primary_muscle_id" value="Primary muscle" />
                <select id="primary_muscle_id" name="primary_muscle_id" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
                    <option value="">—</option>
                    @foreach ($muscles as $m)<option value="{{ $m->id }}">{{ $m->name }}</option>@endforeach
                </select>
            </div>
            <div>
                <x-input-label for="equipment_id" value="Equipment" />
                <select id="equipment_id" name="equipment_id" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
                    <option value="">—</option>
                    @foreach ($equipment as $e)<option value="{{ $e->id }}">{{ $e->name }}</option>@endforeach
                </select>
            </div>
        </div>
        <div>
            <x-input-label for="description" value="Description" />
            <textarea id="description" name="description" rows="3" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">{{ old('description') }}</textarea>
        </div>
        <div>
            <x-input-label for="instructions" value="Instructions" />
            <textarea id="instructions" name="instructions" rows="4" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">{{ old('instructions') }}</textarea>
        </div>
        <x-primary-button>Create exercise</x-primary-button>
    </form>
</x-app-layout>
