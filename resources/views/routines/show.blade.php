<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between gap-3">
            <div>
                <h1 class="text-xl font-extrabold">{{ $routine->name }}</h1>
                <p class="text-sm text-zinc-500">{{ $routine->exercises->count() }} exercises {{ $routine->folder ? '· '.$routine->folder->name : '' }}</p>
            </div>
            <form method="POST" action="{{ route('workouts.start-routine', $routine) }}">@csrf
                <button class="rounded-xl bg-lime-400 text-zinc-950 text-sm font-bold px-4 py-2">Start Workout</button>
            </form>
        </div>
    </x-slot>

    @if ($routine->description)<p class="text-sm text-zinc-500 mb-4">{{ $routine->description }}</p>@endif

    <div class="space-y-3">
        @forelse ($routine->exercises as $re)
            <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
                <p class="font-bold">{{ $re->exercise->name }}</p>
                <p class="text-xs text-zinc-500">{{ $re->exercise->primaryMuscle?->name ?? '' }} · rest {{ $re->rest_seconds ?? 90 }}s</p>
                <div class="mt-2 overflow-x-auto">
                    <table class="w-full text-sm tabular-nums">
                        <thead class="text-xs text-zinc-500"><tr><th class="text-left py-1">Set</th><th class="text-left">Target</th><th class="text-left">Type</th></tr></thead>
                        <tbody>
                            @foreach ($re->targetSets as $i => $ts)
                                <tr class="border-t border-zinc-100 dark:border-zinc-800">
                                    <td class="py-1">{{ $i + 1 }}</td>
                                    <td>{{ $ts->target_weight_kg ? $ts->target_weight_kg.' kg × ' : '' }}{{ $ts->target_reps_max ?? $ts->target_reps_min ?? '—' }} reps</td>
                                    <td>{{ $ts->set_type->label() }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        @empty
            <x-empty-state title="No exercises in this routine" hint="Edit the routine or add exercises when you start a workout." />
        @endforelse
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-sm">
        <a href="{{ route('routines.edit', $routine) }}" class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 font-bold">Edit</a>
        <form method="POST" action="{{ route('routines.duplicate', $routine) }}">@csrf<button class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 font-bold">Duplicate</button></form>
        <form method="POST" action="{{ route('routines.archive', $routine) }}">@csrf<button class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 font-bold">{{ $routine->isArchived() ? 'Unarchive' : 'Archive' }}</button></form>
        <form method="POST" action="{{ route('routines.destroy', $routine) }}" onsubmit="return confirm('Delete this routine?')">@csrf @method('DELETE')<button class="rounded-xl border border-red-300 text-red-500 px-4 py-2 font-bold">Delete</button></form>
    </div>
</x-app-layout>
