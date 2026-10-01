<?php

use App\Support\UsernameGenerator;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 30)->nullable()->after('name');
        });

        // Backfill existing accounts before adding the unique index.
        DB::table('users')->orderBy('id')->select(['id', 'name'])->each(function ($u) {
            DB::table('users')->where('id', $u->id)->update([
                'username' => UsernameGenerator::generate((string) $u->name, (int) $u->id),
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });

        Schema::table('workouts', function (Blueprint $table) {
            // Existing workouts stay private so nothing is exposed retroactively.
            $table->string('visibility', 20)->default('private')->after('status');
            $table->text('description')->nullable()->after('notes');
            $table->index(['visibility', 'ended_at']);
        });

        Schema::table('user_settings', function (Blueprint $table) {
            $table->string('default_workout_visibility', 20)->default('public')->after('week_starts_on');
        });

        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('following_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['follower_id', 'following_id']);
            $table->index('following_id');
        });

        Schema::create('workout_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_id')->constrained('workouts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['workout_id', 'user_id']);
        });

        Schema::create('workout_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_id')->constrained('workouts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('body', 1000);
            $table->timestamps();
            $table->index(['workout_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_comments');
        Schema::dropIfExists('workout_likes');
        Schema::dropIfExists('follows');

        Schema::table('user_settings', function (Blueprint $table) {
            $table->dropColumn('default_workout_visibility');
        });

        Schema::table('workouts', function (Blueprint $table) {
            $table->dropIndex(['visibility', 'ended_at']);
            $table->dropColumn(['visibility', 'description']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
