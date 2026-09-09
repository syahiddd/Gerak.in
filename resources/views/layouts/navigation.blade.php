<nav x-data="{ open: false }" class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex items-center gap-8">
                <a href="{{ route('dashboard') }}" class="flex items-center gap-2">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-zinc-950 font-extrabold">G</span>
                    <span class="font-extrabold tracking-tight text-lg">Gerak<span class="text-lime-500">.in</span></span>
                </a>
                <div class="hidden sm:flex items-center gap-1 text-sm font-medium">
                    <a href="{{ route('dashboard') }}" class="px-3 py-2 rounded-lg {{ request()->routeIs('dashboard') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white' }}">Dashboard</a>
                    <a href="{{ route('workouts.index') }}" class="px-3 py-2 rounded-lg {{ request()->routeIs('workouts.*') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white' }}">Workout</a>
                    <a href="{{ route('routines.index') }}" class="px-3 py-2 rounded-lg {{ request()->routeIs('routines.*') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white' }}">Routines</a>
                    <a href="{{ route('exercises.index') }}" class="px-3 py-2 rounded-lg {{ request()->routeIs('exercises.*') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white' }}">Exercises</a>
                    <a href="{{ route('workouts.index') }}" class="px-3 py-2 rounded-lg {{ request()->routeIs('statistics.*') || request()->routeIs('records.*') ? 'bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white' }} hidden lg:inline">History</a>
                    <a href="{{ route('statistics.index') }}" class="px-3 py-2 rounded-lg {{ request()->routeIs('statistics.*') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white' }}">Statistics</a>
                </div>
            </div>

            <div class="hidden sm:flex sm:items-center gap-2">
                <button
                    x-data
                    @click="const d = document.documentElement.classList.toggle('dark'); localStorage.setItem('gerak-theme', d ? 'dark' : 'light')"
                    class="px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700"
                    aria-label="Toggle theme">Theme</button>
                <x-dropdown align="right" width="48">
                    <x-slot name="trigger">
                        <button class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none">
                            <div>{{ Auth::user()->name }}</div>
                            <svg class="ms-1 h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </button>
                    </x-slot>
                    <x-slot name="content">
                        <x-dropdown-link :href="route('profile.edit')">Profile</x-dropdown-link>
                        <x-dropdown-link :href="route('settings.edit')">Settings</x-dropdown-link>
                        @if (auth()->user()->isAdmin())
                            <x-dropdown-link :href="route('admin.dashboard')">Admin</x-dropdown-link>
                        @endif
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <x-dropdown-link :href="route('logout')" onclick="event.preventDefault(); this.closest('form').submit();">Log Out</x-dropdown-link>
                        </form>
                    </x-slot>
                </x-dropdown>
            </div>

            <div class="-me-2 flex items-center sm:hidden">
                <button @click="open = ! open" class="p-2 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Menu">
                    <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path class="inline-flex" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
        </div>
    </div>

    <div :class="{'block': open, 'hidden': ! open}" class="hidden sm:hidden border-t border-zinc-200 dark:border-zinc-800">
        <div class="px-4 py-3 space-y-1 text-sm font-medium">
            <a href="{{ route('dashboard') }}" class="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Dashboard</a>
            <a href="{{ route('workouts.index') }}" class="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Workout</a>
            <a href="{{ route('routines.index') }}" class="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Routines</a>
            <a href="{{ route('exercises.index') }}" class="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Exercises</a>
            <a href="{{ route('statistics.index') }}" class="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Statistics</a>
            <a href="{{ route('profile.edit') }}" class="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Profile</a>
            <a href="{{ route('settings.edit') }}" class="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Settings</a>
            <form method="POST" action="{{ route('logout') }}">@csrf<button class="block w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">Log Out</button></form>
        </div>
    </div>
</nav>
