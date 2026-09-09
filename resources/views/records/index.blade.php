<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Personal Records</h1></x-slot>

    @if ($records->isEmpty())
        <x-empty-state title="No PRs yet" hint="Finish a workout and your records will be detected automatically." />
    @else
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($records as $pr)
                <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
                    <p class="font-bold">{{ $pr->exercise->name }}</p>
                    <p class="text-xs text-zinc-500">{{ $pr->record_type->label() }}</p>
                    <p class="mt-1 text-xl font-extrabold tabular-nums">{{ $pr->value_primary }}{{ $pr->value_reps ? ' × '.$pr->value_reps : '' }}</p>
                    <p class="text-xs text-zinc-500">{{ $pr->achieved_at?->format('d M Y') }}</p>
                </div>
            @endforeach
        </div>
        <div class="mt-4">{{ $records->links() }}</div>
    @endif
</x-app-layout>
