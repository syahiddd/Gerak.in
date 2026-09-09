<x-app-layout>
    <x-slot name="header">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-xl font-extrabold">{{ $workout->name }}</h1>
                <p class="text-sm text-zinc-500">
                    {{ $workout->started_at->format('d M Y, H:i') }}
                    @if ($workout->status->value === 'completed' && $workout->duration_seconds)
                        · {{ gmdate('H:i:s', $workout->duration_seconds) }} · {{ number_format((float) $workout->total_volume_kg) }} kg
                    @else
                        · <span class="font-semibold text-lime-600 dark:text-lime-400">{{ ucfirst(str_replace('_', ' ', $workout->status->value)) }}</span>
                        · <span id="elapsed" data-started="{{ $workout->started_at->toIso8601String() }}" class="tabular-nums">—</span>
                    @endif
                </p>
            </div>
            @if ($workout->isActive())
                <div class="flex gap-2 text-sm">
                    <form method="POST" action="{{ route('workouts.finish', $workout) }}">@csrf<button class="rounded-xl bg-lime-400 text-zinc-950 font-bold px-4 py-2">Finish</button></form>
                    <form method="POST" action="{{ route('workouts.cancel', $workout) }}" onsubmit="return confirm('Cancel this workout?')">@csrf<button class="rounded-xl border border-red-300 text-red-500 font-bold px-4 py-2">Cancel</button></form>
                </div>
            @else
                <form method="POST" action="{{ route('workouts.destroy', $workout) }}" onsubmit="return confirm('Delete this workout? This preserves no history.')">@csrf @method('DELETE')<button class="rounded-xl border border-red-300 text-red-500 text-sm font-bold px-4 py-2">Delete</button></form>
            @endif
        </div>
    </x-slot>

    @if ($workout->isActive())
        <div class="mb-4 rounded-2xl bg-zinc-950 text-white dark:bg-lime-400 dark:text-zinc-950 p-4" x-data="restTimer()" @set-complete.window="start(90)">
            <div class="flex items-center justify-between">
                <p class="font-bold text-sm">REST <span x-text="display" class="tabular-nums text-lg ms-2">—</span></p>
                <div class="flex gap-2 text-sm">
                    <button @click="start(90)" class="rounded-lg bg-white/20 dark:bg-zinc-950/10 px-3 py-1 font-bold">1:30</button>
                    <button @click="start(180)" class="rounded-lg bg-white/20 dark:bg-zinc-950/10 px-3 py-1 font-bold">3:00</button>
                    <button @click="stop()" class="rounded-lg bg-white/20 dark:bg-zinc-950/10 px-3 py-1 font-bold">Skip</button>
                </div>
            </div>
        </div>
    @endif

    <div class="space-y-4" id="workout-exercises">
        @foreach ($workout->exercises as $we)
            <section class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4" data-exercise="{{ $we->id }}">
                <div class="flex items-center justify-between">
                    <div>
                        <a href="{{ route('exercises.show', $we->exercise->slug) }}" class="font-bold hover:underline">{{ $we->exercise->name }}</a>
                        <p class="text-xs text-zinc-500">{{ $we->exercise->primaryMuscle?->name ?? '' }}</p>
                    </div>
                    @if ($workout->isActive())
                        <form method="POST" action="{{ route('workouts.remove-exercise', [$workout, $we]) }}" onsubmit="return confirm('Remove exercise?')">@csrf @method('DELETE')<button class="text-xs text-red-500 font-semibold">Remove</button></form>
                    @endif
                </div>

                @if (!empty($previous[$we->id]) && $previous[$we->id]->isNotEmpty())
                    <p class="mt-2 text-xs text-zinc-500">LAST TIME:
                        @foreach ($previous[$we->id] as $p)<span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ $p->weight_kg ? $p->weight_kg.' kg × '.$p->reps : $p->reps.' reps' }}</span>@if (!$loop->last), @endif @endforeach
                    </p>
                @endif

                <div class="mt-2 overflow-x-auto">
                    <table class="w-full text-sm tabular-nums">
                        <thead class="text-xs text-zinc-500">
                            <tr><th class="text-left py-1 w-10">Set</th><th class="text-left">Type</th><th class="text-left">Weight</th><th class="text-left">Reps</th><th class="text-left">RPE</th><th class="text-left">Done</th>@if ($workout->isActive())<th></th>@endif</tr>
                        </thead>
                        <tbody>
                            @foreach ($we->sets as $set)
                                <tr class="border-t border-zinc-100 dark:border-zinc-800 set-row" data-set="{{ $set->id }}">
                                    <td class="py-1 font-bold">{{ $loop->iteration }}</td>
                                    <td>{{ $set->set_type->shortLabel() }}</td>
                                    @if ($workout->isActive())
                                        <td><input type="number" step="0.5" min="0" value="{{ $set->weight_kg }}" data-field="weight_kg" class="set-input w-20 rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm py-1" aria-label="Weight kg" /></td>
                                        <td><input type="number" min="0" value="{{ $set->reps }}" data-field="reps" class="set-input w-16 rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm py-1" aria-label="Reps" /></td>
                                        <td><input type="number" step="0.5" min="0" max="10" value="{{ $set->rpe }}" data-field="rpe" class="set-input w-14 rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm py-1" aria-label="RPE" /></td>
                                        <td><button class="toggle-set rounded-lg px-3 py-1 font-bold {{ $set->is_completed ? 'bg-lime-400 text-zinc-950' : 'border border-zinc-300 dark:border-zinc-700' }}" data-completed="{{ $set->is_completed ? '1' : '0' }}" aria-label="Toggle set complete">{{ $set->is_completed ? '✓' : '○' }}</button></td>
                                        <td><button class="delete-set text-red-500 text-xs" aria-label="Delete set">✕</button></td>
                                    @else
                                        <td>{{ $set->weight_kg ?? '—' }}</td>
                                        <td>{{ $set->reps ?? '—' }}</td>
                                        <td>{{ $set->rpe ?? '—' }}</td>
                                        <td>{{ $set->is_completed ? '✓' : '—' }}</td>
                                    @endif
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                @if ($workout->isActive())
                    <form method="POST" action="{{ route('workouts.store-set', $workout) }}" class="mt-2">
                        @csrf
                        <input type="hidden" name="workout_exercise_id" value="{{ $we->id }}" />
                        <button class="rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-bold px-4 py-2">+ Add set</button>
                    </form>
                @endif

                @if ($we->notes)<p class="mt-2 text-xs text-zinc-500">{{ $we->notes }}</p>@endif
            </section>
        @endforeach
    </div>

    @if ($workout->isActive())
        <form method="POST" action="{{ route('workouts.add-exercise', $workout) }}" class="mt-4 flex gap-2 max-w-xl">
            @csrf
            <select name="exercise_id" class="block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm" required>
                <option value="">Add exercise…</option>
                @foreach ($library as $ex)<option value="{{ $ex->id }}">{{ $ex->name }}</option>@endforeach
            </select>
            <button class="rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-bold px-4 py-2 whitespace-nowrap">Add</button>
        </form>

        <form method="POST" action="{{ route('workouts.update', $workout) }}" class="mt-4 max-w-xl">
            @csrf @method('PATCH')
            <label class="text-sm font-semibold" for="notes">Workout notes</label>
            <textarea id="notes" name="notes" rows="2" class="mt-1 block w-full rounded-xl border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-sm">{{ old('notes', $workout->notes) }}</textarea>
            <button class="mt-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-bold px-4 py-2">Save notes</button>
        </form>
    @elseif ($workout->notes)
        <div class="mt-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 class="font-bold text-sm">Notes</h2>
            <p class="text-sm text-zinc-600 dark:text-zinc-300">{{ $workout->notes }}</p>
        </div>
    @endif

    @if ($workout->isActive())
    @push('scripts')
    <script>
        // Elapsed timer (frontend only; server timestamps authoritative on finish).
        (function () {
            const el = document.getElementById('elapsed');
            if (!el) return;
            const started = new Date(el.dataset.started).getTime();
            const tick = () => {
                const s = Math.max(0, Math.floor((Date.now() - started) / 1000));
                const h = String(Math.floor(s / 3600)).padStart(2, '0');
                const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
                const sec = String(s % 60).padStart(2, '0');
                el.textContent = `${h}:${m}:${sec}`;
            };
            tick(); setInterval(tick, 1000);
            // Draft backup so a refresh never loses context (server is source of truth).
            try { localStorage.setItem('gerak-active-workout', '{{ $workout->id }}'); } catch (e) {}
        })();

        function restTimer() {
            return {
                display: '—', left: 0, timer: null,
                start(sec) {
                    this.stop(); this.left = sec; this.render();
                    this.timer = setInterval(() => {
                        this.left--;
                        this.render();
                        if (this.left <= 0) { this.stop(); this.display = 'GO'; try { new Audio().play?.(); } catch (e) {} }
                    }, 1000);
                },
                stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.left = 0; this.display = '—'; },
                render() {
                    const m = String(Math.floor(this.left / 60)).padStart(2, '0');
                    const s = String(this.left % 60).padStart(2, '0');
                    this.display = `${m}:${s}`;
                }
            };
        }

        // Autosave sets (debounced) + toggle complete.
        (function () {
            const token = document.querySelector('meta[name="csrf-token"]').content;
            const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
            const save = debounce((id, payload) => {
                fetch(`/sets/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }, 500);

            document.querySelectorAll('.set-input').forEach(input => {
                input.addEventListener('change', () => {
                    const row = input.closest('.set-row');
                    save(row.dataset.set, { [input.dataset.field]: input.value === '' ? null : input.value });
                });
            });

            document.querySelectorAll('.toggle-set').forEach(btn => {
                btn.addEventListener('click', () => {
                    const row = btn.closest('.set-row');
                    const next = btn.dataset.completed !== '1';
                    btn.dataset.completed = next ? '1' : '0';
                    btn.textContent = next ? '✓' : '○';
                    btn.className = 'toggle-set rounded-lg px-3 py-1 font-bold ' + (next ? 'bg-lime-400 text-zinc-950' : 'border border-zinc-300 dark:border-zinc-700');
                    fetch(`/sets/${row.dataset.set}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
                        body: JSON.stringify({ is_completed: next }),
                    }).then(() => { if (next) window.dispatchEvent(new CustomEvent('set-complete')); });
                });
            });

            document.querySelectorAll('.delete-set').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!confirm('Delete set?')) return;
                    const row = btn.closest('.set-row');
                    fetch(`/sets/${row.dataset.set}`, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': token, 'Accept': 'application/json' } })
                        .then(() => row.remove());
                });
            });
        })();
    </script>
    @endpush
    @endif
</x-app-layout>
