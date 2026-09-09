<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained('exercises')->cascadeOnDelete();
            $table->string('record_type', 30);
            $table->decimal('value_primary', 12, 2);
            $table->unsignedSmallInteger('value_reps')->nullable();
            $table->foreignId('achieved_workout_id')->nullable()->constrained('workouts')->nullOnDelete();
            $table->timestamp('achieved_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'exercise_id', 'record_type']);
            $table->index(['user_id', 'achieved_at']);
        });

        Schema::create('body_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 30);
            $table->decimal('value', 8, 2);
            $table->timestamp('recorded_at')->nullable();
            $table->string('notes', 500)->nullable();
            $table->timestamps();
            $table->index(['user_id', 'type', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('body_measurements');
        Schema::dropIfExists('personal_records');
    }
};
