<x-app-layout>
    <x-slot name="header"><h1 class="text-xl font-extrabold">Settings</h1></x-slot>

    <form method="POST" action="{{ route('settings.update') }}" class="max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        @csrf @method('PATCH')
        <div class="grid sm:grid-cols-2 gap-3">
            <div>
                <x-input-label for="unit_system" value="Unit system" />
                <select id="unit_system" name="unit_system" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
                    <option value="metric" @selected($settings->unit_system->value === 'metric')>Metric (kg / cm)</option>
                    <option value="imperial" @selected($settings->unit_system->value === 'imperial')>Imperial (lb / in)</option>
                </select>
            </div>
            <div>
                <x-input-label for="theme" value="Theme" />
                <select id="theme" name="theme" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" onchange="localStorage.setItem('gerak-theme', this.value)">
                    <option value="system" @selected($settings->theme === 'system')>System</option>
                    <option value="light" @selected($settings->theme === 'light')>Light</option>
                    <option value="dark" @selected($settings->theme === 'dark')>Dark</option>
                </select>
            </div>
            <div>
                <x-input-label for="default_rest_seconds" value="Default rest (seconds)" />
                <x-text-input id="default_rest_seconds" name="default_rest_seconds" type="number" min="0" max="3600" class="mt-1 block w-full" value="{{ old('default_rest_seconds', $settings->default_rest_seconds) }}" required />
            </div>
            <div>
                <x-input-label for="default_sets" value="Default sets" />
                <x-text-input id="default_sets" name="default_sets" type="number" min="1" max="20" class="mt-1 block w-full" value="{{ old('default_sets', $settings->default_sets) }}" required />
            </div>
            <div>
                <x-input-label for="week_starts_on" value="Week starts on" />
                <select id="week_starts_on" name="week_starts_on" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
                    <option value="mon" @selected($settings->week_starts_on === 'mon')>Monday</option>
                    <option value="sun" @selected($settings->week_starts_on === 'sun')>Sunday</option>
                </select>
            </div>
            <div>
                <x-input-label for="timezone" value="Timezone" />
                <x-text-input id="timezone" name="timezone" class="mt-1 block w-full" value="{{ old('timezone', $user->timezone) }}" required />
            </div>
        </div>
        <x-primary-button>Save settings</x-primary-button>
    </form>
</x-app-layout>
