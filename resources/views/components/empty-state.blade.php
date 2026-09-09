@props(['title', 'hint' => null, 'action' => null])
<div class="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 text-center">
    <p class="font-bold">{{ $title }}</p>
    @if ($hint)<p class="mt-1 text-sm text-zinc-500">{{ $hint }}</p>@endif
    @if ($action)<div class="mt-4">{{ $action }}</div>@endif
</div>
