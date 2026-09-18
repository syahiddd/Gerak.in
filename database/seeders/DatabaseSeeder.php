<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ReferenceSeeder::class,
            ExerciseSeeder::class,
            // ExerciseMediaSeeder runs manually (needs EXERCISEDB_API_KEY):
            // php artisan db:seed --class=ExerciseMediaSeeder
            DemoSeeder::class,
        ]);
    }
}
