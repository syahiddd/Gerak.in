<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Gerak.in') }} — Train with intent</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800&display=swap" rel="stylesheet" />
        <script>
            // Theme pre-hydration (avoid flash). Server default: system.
            (function () {
                try {
                    var t = localStorage.getItem('gerak-theme') || '{{ auth()->user()?->settings?->theme ?? 'system' }}';
                    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    if (dark) document.documentElement.classList.add('dark');
                } catch (e) {}
            })();
        </script>

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div class="min-h-screen pb-20 sm:pb-0">
            @include('layouts.navigation')

            @isset($header)
                <header class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <div class="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
                        {{ $header }}
                    </div>
                </header>
            @endisset

            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                @if (session('success'))
                    <div class="mb-4 rounded-xl bg-lime-100 border border-lime-300 text-lime-900 px-4 py-3 text-sm dark:bg-lime-950 dark:border-lime-800 dark:text-lime-200" role="status">{{ session('success') }}</div>
                @endif
                @if (session('info'))
                    <div class="mb-4 rounded-xl bg-sky-100 border border-sky-300 text-sky-900 px-4 py-3 text-sm dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200" role="status">{{ session('info') }}</div>
                @endif
                @if (session('pr_events'))
                    <div class="mb-4 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 text-sm dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200" role="status">
                        <p class="font-bold">New Personal Record{{ count(session('pr_events')) > 1 ? 's' : '' }}!</p>
                        <ul class="list-disc ms-5 mt-1">
                            @foreach (session('pr_events') as $pr)
                                <li><strong>{{ $pr['exercise'] }}</strong> — {{ $pr['type'] }}: {{ $pr['detail'] }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif
                @if ($errors->any())
                    <div class="mb-4 rounded-xl bg-red-100 border border-red-300 text-red-900 px-4 py-3 text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-200" role="alert">
                        <ul class="list-disc ms-5">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                {{ $slot }}
            </main>

            <!-- Mobile bottom nav -->
            <nav class="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800" aria-label="Mobile">
                <div class="grid grid-cols-5 text-[11px] font-medium">
                    <a href="{{ route('dashboard') }}" class="flex flex-col items-center py-2 {{ request()->routeIs('dashboard') ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500' }}">Home</a>
                    <a href="{{ route('workouts.index') }}" class="flex flex-col items-center py-2 {{ request()->routeIs('workouts.*') ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500' }}">Workout</a>
                    <a href="{{ route('routines.index') }}" class="flex flex-col items-center py-2 {{ request()->routeIs('routines.*') ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500' }}">Routines</a>
                    <a href="{{ route('statistics.index') }}" class="flex flex-col items-center py-2 {{ request()->routeIs('statistics.*') ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500' }}">Stats</a>
                    <a href="{{ route('profile.edit') }}" class="flex flex-col items-center py-2 {{ request()->routeIs('profile.*') ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500' }}">Profile</a>
                </div>
            </nav>
        </div>
        @stack('scripts')
    </body>
</html>
