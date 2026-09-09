@props(['label', 'value', 'sub' => null])
<div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
    <p class="text-xs font-medium uppercase tracking-wide text-zinc-500">{{ $label }}</p>
    <p class="mt-1 text-2xl font-extrabold tabular-nums">{{ $value }}</p>
    @if ($sub)<p class="mt-1 text-xs text-zinc-500">{{ $sub }}</p>@endif
</div>
