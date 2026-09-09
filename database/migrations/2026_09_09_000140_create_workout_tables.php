<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('routine_id')->nullable()->constrained('routines')->nullOnDelete();
            $table->string('name');
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('in_progress');
            $table->timestamp('started_at')->nullable();
            $table->unsignedInteger('paused_seconds_total')->default(0);
            $table->timestamp('ended_at')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->decimal('total_volume_kg', 12, 2)->nullable();
            $table->string('timezone', 64)->default('Asia/Jakarta');
            $table->timestamps();
            $table->index(['user_id', 'status', 'started_at']);
        });

        Schema::create('workout_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_id')->constrained('workouts')->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained('exercises')->restrictOnDelete();
            $table->unsignedSmallInteger('order')->default(0);
            $table->text('notes')->nullable();
            $table->string('superset_group', 20)->nullable();
            $table->timestamps();
            $table->index(['workout_id', 'order']);
        });

        Schema::create('workout_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_exercise_id')->constrained('workout_exercises')->cascadeOnDelete();
            $table->unsignedSmallInteger('order')->default(0);
            $table->string('set_type', 20)->default('normal');
            $table->decimal('weight_kg', 8, 2)->nullable();
            $table->unsignedSmallInteger('reps')->nullable();
            $table->unsignedInteger('duration_s')->nullable();
            $table->unsignedInteger('distance_m')->nullable();
            $table->decimal('rpe', 3, 1)->nullable();
            $table->decimal('bodyweight_kg', 6, 2)->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['workout_exercise_id', 'is_completed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_sets');
        Schema::dropIfExists('workout_exercises');
        Schema::dropIfExists('workouts');
    }
};
