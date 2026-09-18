<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->string('external_id', 64)->nullable()->unique()->after('slug');
            $table->string('image_url', 500)->nullable()->after('image_path');
            $table->json('image_urls')->nullable()->after('image_url');
            $table->string('gif_url', 500)->nullable()->after('image_urls');
            $table->text('overview')->nullable()->after('description');
            $table->json('exercise_tips')->nullable()->after('instructions');
            $table->json('variations')->nullable()->after('exercise_tips');
            $table->json('related_exercise_ids')->nullable()->after('variations');
            $table->json('keywords')->nullable()->after('related_exercise_ids');
            $table->string('media_source', 20)->default('local')->after('video_url');
            $table->timestamp('last_synced_at')->nullable()->after('media_source');
            $table->index('external_id');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropIndex(['external_id']);
            $table->dropUnique(['external_id']);
            $table->dropColumn([
                'external_id',
                'image_url',
                'image_urls',
                'gif_url',
                'overview',
                'exercise_tips',
                'variations',
                'related_exercise_ids',
                'keywords',
                'media_source',
                'last_synced_at',
            ]);
        });
    }
};
