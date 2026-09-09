<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">New routine</h1></x-slot>

    <form method="POST" action="{{ route('routines.store') }}" class="max-w-3xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4" x-data="{ rows: [{exercise_id: '', rest_seconds: 90}] }">
        @csrf
        <div>
            <x-input-label for="name" value="Routine name" />
            <x-text-input id="name" name="name" class="mt-1 block w-full" required placeholder="Push Day" value="{{ old('name') }}" />
        </div>
        <div>
            <x-input-label for="description" value="Description" />
            <textarea id="description" name="description" rows="2" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">{{ old('description') }}</textarea>
        </div>

        <h2 class="font-bold">Exercises</h2>
        <template x-for="(row, i) in rows" :key="i">
            <div class="grid grid-cols-12 gap-2 items-end rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                <div class="col-span-7">
                    <label class="text-xs font-semibold">Exercise</label>
                    <select :name="`exercises[${i}][exercise_id]`" x-model="row.exercise_id" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" required>
                        <option value="">Select…</option>
                        @foreach ($exercises as $ex)<option value="{{ $ex->id }}">{{ $ex->name }}</option>@endforeach
                    </select>
                </div>
                <div class="col-span-3">
                    <label class="text-xs font-semibold">Rest (s)</label>
                    <input type="number" :name="`exercises[${i}][rest_seconds]`" x-model="row.rest_seconds" min="0" max="3600" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" />
                </div>
                <div class="col-span-2">
                    <button type="button" @click="rows.splice(i, 1)" class="w-full rounded-xl border border-red-300 text-red-500 text-sm font-bold px-2 py-2">Remove</button>
                </div>
            </div>
        </template>
        <button type="button" @click="rows.push({exercise_id: '', rest_seconds: 90})" class="rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-bold px-4 py-2">+ Add exercise</button>

        <div><x-primary-button>Create routine</x-primary-button></div>
        <p class="text-xs text-zinc-500">Target sets default to 3× normal. Fine-tune weight/reps later per workout — the routine stays a template.</p>
    </form>
</x-app-layout>
