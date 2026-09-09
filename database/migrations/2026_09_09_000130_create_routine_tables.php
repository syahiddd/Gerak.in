<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routine_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->unique(['user_id', 'name']);
        });

        Schema::create('routines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('folder_id')->nullable()->constrained('routine_folders')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['user_id', 'status']);
        });

        Schema::create('routine_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('routine_id')->constrained('routines')->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained('exercises')->restrictOnDelete();
            $table->unsignedSmallInteger('order')->default(0);
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('rest_seconds')->nullable();
            $table->string('superset_group', 20)->nullable();
            $table->timestamps();
            $table->index(['routine_id', 'order']);
        });

        Schema::create('routine_exercise_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('routine_exercise_id')->constrained('routine_exercises')->cascadeOnDelete();
            $table->unsignedSmallInteger('order')->default(0);
            $table->unsignedSmallInteger('target_reps_min')->nullable();
            $table->unsignedSmallInteger('target_reps_max')->nullable();
            $table->decimal('target_weight_kg', 8, 2)->nullable();
            $table->unsignedInteger('target_duration_s')->nullable();
            $table->unsignedInteger('target_distance_m')->nullable();
            $table->string('set_type', 20)->default('normal');
            $table->decimal('target_rpe', 3, 1)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('routine_exercise_sets');
        Schema::dropIfExists('routine_exercises');
        Schema::dropIfExists('routines');
        Schema::dropIfExists('routine_folders');
    }
};
