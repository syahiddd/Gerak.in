<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReferenceSeeder extends Seeder
{
    public function run(): void
    {
        $muscles = [
            ['Chest', 'chest', 'push'],
            ['Back', 'back', 'pull'],
            ['Lats', 'lats', 'pull'],
            ['Shoulders', 'shoulders', 'push'],
            ['Biceps', 'biceps', 'pull'],
            ['Triceps', 'triceps', 'push'],
            ['Quadriceps', 'quadriceps', 'legs'],
            ['Hamstrings', 'hamstrings', 'legs'],
            ['Glutes', 'glutes', 'legs'],
            ['Calves', 'calves', 'legs'],
            ['Core', 'core', 'core'],
            ['Traps', 'traps', 'pull'],
            ['Forearms', 'forearms', 'pull'],
        ];

        foreach ($muscles as [$name, $slug, $group]) {
            DB::table('muscles')->updateOrInsert(
                ['slug' => $slug],
                ['name' => $name, 'group' => $group, 'created_at' => now(), 'updated_at' => now()]
            );
        }

        $equipment = [
            'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine',
            'Bodyweight', 'Resistance Band', 'EZ Bar', 'Bench', 'Pull-up Bar',
            'Rower', 'Treadmill',
        ];

        foreach ($equipment as $name) {
            DB::table('equipment')->updateOrInsert(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
