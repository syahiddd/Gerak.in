<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_id')->constrained('workouts')->cascadeOnDelete();
            $table->string('path');
            $table->unsignedSmallInteger('width')->nullable();
            $table->unsignedSmallInteger('height')->nullable();
            $table->unsignedTinyInteger('order')->default(0);
            $table->timestamps();
            $table->index(['workout_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_photos');
    }
};
