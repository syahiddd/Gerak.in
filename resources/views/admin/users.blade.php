<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Admin — Users</h1></x-slot>

    <form method="GET" class="flex gap-2 max-w-md">
        <x-text-input name="q" placeholder="Search name or email…" value="{{ request('q') }}" class="block w-full" />
        <x-primary-button>Search</x-primary-button>
    </form>

    <div class="mt-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
        @foreach ($users as $u)
            <div class="p-4 flex items-center justify-between text-sm">
                <div>
                    <p class="font-bold">{{ $u->name }} @if ($u->is_suspended)<span class="text-red-500">(suspended)</span>@endif</p>
                    <p class="text-zinc-500">{{ $u->email }} · {{ $u->role->value }}</p>
                </div>
                @if ((int) $u->id !== (int) auth()->id())
                    @if ($u->is_suspended)
                        <form method="POST" action="{{ route('admin.users.activate', $u) }}">@csrf<button class="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1 font-bold">Activate</button></form>
                    @else
                        <form method="POST" action="{{ route('admin.users.suspend', $u) }}">@csrf<button class="rounded-xl border border-red-300 text-red-500 px-3 py-1 font-bold">Suspend</button></form>
                    @endif
                @endif
            </div>
        @endforeach
    </div>
    <div class="mt-4">{{ $users->links() }}</div>
</x-app-layout>
