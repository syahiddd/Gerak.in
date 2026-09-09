<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->string('avatar_path')->nullable();
            $table->string('bio', 500)->nullable();
            $table->decimal('height_cm', 5, 1)->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        Schema::create('user_settings', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->string('unit_system', 20)->default('metric');
            $table->string('theme', 20)->default('system');
            $table->unsignedSmallInteger('default_rest_seconds')->default(90);
            $table->unsignedTinyInteger('default_sets')->default(3);
            $table->string('week_starts_on', 10)->default('mon');
            $table->json('notifications')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_settings');
        Schema::dropIfExists('user_profiles');
    }
};
