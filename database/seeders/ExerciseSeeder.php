<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * System exercise library. Never hardcode these in controllers/views —
 * always query the DB (cached). Add new rows here, not in code.
 */
class ExerciseSeeder extends Seeder
{
    public function run(): void
    {
        $muscleId = fn (?string $slug) => $slug ? DB::table('muscles')->where('slug', $slug)->value('id') : null;
        $equipId = fn (?string $name) => $name ? DB::table('equipment')->where('slug', Str::slug($name))->value('id') : null;

        // [name, muscle slug, equipment, type, description]
        $rows = [
            ['Barbell Bench Press', 'chest', 'Barbell', 'weight_reps', 'Lie on a flat bench, lower the bar to mid-chest, press up.'],
            ['Incline Dumbbell Press', 'chest', 'Dumbbell', 'weight_reps', 'Press dumbbells from an incline bench, 30-45 degrees.'],
            ['Incline Barbell Press', 'chest', 'Barbell', 'weight_reps', 'Incline bench press for upper chest emphasis.'],
            ['Push-Up', 'chest', 'Bodyweight', 'bodyweight_reps', 'Plank position, lower chest to floor, push up.'],
            ['Chest Dip', 'chest', 'Bodyweight', 'weighted_bodyweight', 'Lean forward on parallel bars, dip and press.'],
            ['Cable Fly', 'chest', 'Cable', 'weight_reps', 'Standing cable fly, squeeze at center.'],
            ['Overhead Press', 'shoulders', 'Barbell', 'weight_reps', 'Standing strict press from shoulders to overhead.'],
            ['Arnold Press', 'shoulders', 'Dumbbell', 'weight_reps', 'Rotating dumbbell press for all delt heads.'],
            ['Lateral Raise', 'shoulders', 'Dumbbell', 'weight_reps', 'Raise arms to the sides to shoulder height.'],
            ['Face Pull', 'shoulders', 'Cable', 'weight_reps', 'Pull rope to face, externally rotate.'],
            ['Pull-Up', 'lats', 'Pull-up Bar', 'bodyweight_reps', 'Overhand grip, pull chin over bar.'],
            ['Chin-Up', 'lats', 'Pull-up Bar', 'bodyweight_reps', 'Underhand grip chin-up.'],
            ['Lat Pulldown', 'lats', 'Cable', 'weight_reps', 'Pull bar to upper chest, control the negative.'],
            ['Barbell Row', 'back', 'Barbell', 'weight_reps', 'Hinge forward, row bar to lower ribs.'],
            ['One-Arm Dumbbell Row', 'back', 'Dumbbell', 'weight_reps', 'Knee on bench, row dumbbell to hip.'],
            ['Seated Cable Row', 'back', 'Cable', 'weight_reps', 'Neutral spine, row handle to abdomen.'],
            ['T-Bar Row', 'back', 'Barbell', 'weight_reps', 'Chest-supported or landmine row.'],
            ['Deadlift', 'back', 'Barbell', 'weight_reps', 'Hip hinge, flat back, stand tall with the bar.'],
            ['Romanian Deadlift', 'hamstrings', 'Barbell', 'weight_reps', 'Soft knees, push hips back, stretch hamstrings.'],
            ['Good Morning', 'hamstrings', 'Barbell', 'weight_reps', 'Bar on back, hinge at hips.'],
            ['Barbell Shrug', 'traps', 'Barbell', 'weight_reps', 'Elevate shoulders straight up, pause.'],
            ["Farmer's Carry", 'forearms', 'Dumbbell', 'duration', 'Walk with heavy dumbbells, tall posture.'],
            ['Barbell Curl', 'biceps', 'Barbell', 'weight_reps', 'Strict curl, elbows pinned.'],
            ['Dumbbell Curl', 'biceps', 'Dumbbell', 'weight_reps', 'Alternate or simultaneous curls.'],
            ['Hammer Curl', 'biceps', 'Dumbbell', 'weight_reps', 'Neutral grip curl for brachialis.'],
            ['Preacher Curl', 'biceps', 'EZ Bar', 'weight_reps', 'Strict curl on preacher bench.'],
            ['Tricep Pushdown', 'triceps', 'Cable', 'weight_reps', 'Elbows tucked, extend to lockout.'],
            ['Skullcrusher', 'triceps', 'EZ Bar', 'weight_reps', 'Lying tricep extension to forehead.'],
            ['Close-Grip Bench Press', 'triceps', 'Barbell', 'weight_reps', 'Narrow grip press for triceps.'],
            ['Back Squat', 'quadriceps', 'Barbell', 'weight_reps', 'Bar on upper back, squat to depth.'],
            ['Front Squat', 'quadriceps', 'Barbell', 'weight_reps', 'Bar on front delts, upright torso.'],
            ['Goblet Squat', 'quadriceps', 'Kettlebell', 'weight_reps', 'Hold bell at chest, squat deep.'],
            ['Bulgarian Split Squat', 'quadriceps', 'Dumbbell', 'weight_reps', 'Rear foot elevated split squat.'],
            ['Leg Press', 'quadriceps', 'Machine', 'weight_reps', 'Machine leg press, full foot contact.'],
            ['Leg Extension', 'quadriceps', 'Machine', 'weight_reps', 'Extend knees against pad.'],
            ['Lying Leg Curl', 'hamstrings', 'Machine', 'weight_reps', 'Curl heels to glutes.'],
            ['Hip Thrust', 'glutes', 'Barbell', 'weight_reps', 'Upper back on bench, thrust hips up.'],
            ['Glute Bridge', 'glutes', 'Bodyweight', 'bodyweight_reps', 'Floor bridge, squeeze glutes.'],
            ['Standing Calf Raise', 'calves', 'Machine', 'weight_reps', 'Full stretch and peak contraction.'],
            ['Kettlebell Swing', 'glutes', 'Kettlebell', 'weight_reps', 'Explosive hip hinge swing.'],
            ['Plank', 'core', 'Bodyweight', 'duration', 'Hold a rigid plank, glutes tight.'],
            ['Side Plank', 'core', 'Bodyweight', 'duration', 'Hold side plank, hips high.'],
            ['Hanging Leg Raise', 'core', 'Pull-up Bar', 'bodyweight_reps', 'Hang and raise knees or toes.'],
            ['Russian Twist', 'core', 'Bodyweight', 'bodyweight_reps', 'Seated rotation, controlled.'],
            ['Treadmill Run', 'quadriceps', 'Treadmill', 'distance_duration', 'Steady run, log distance and time.'],
            ['Rowing Erg', 'back', 'Rower', 'distance_duration', 'Row for distance or time.'],
        ];

        $mediaMap = [
            'barbell-bench-press' => ['gif' => '/storage/exercise-gifs/0025.gif', 'video' => 'https://upload.wikimedia.org/wikipedia/commons/d/df/Bench_press_-_exercise_demonstration_video.webm', 'source' => 'gymvisual'],
            'incline-dumbbell-press' => ['gif' => '/storage/exercise-gifs/0314.gif', 'source' => 'gymvisual'],
            'incline-barbell-press' => ['gif' => '/storage/exercise-gifs/0047.gif', 'source' => 'gymvisual'],
            'push-up' => ['gif' => '/storage/exercise-gifs/0662.gif', 'source' => 'gymvisual'],
            'chest-dip' => ['gif' => '/storage/exercise-gifs/0251.gif', 'source' => 'gymvisual'],
            'cable-fly' => ['gif' => '/storage/exercise-gifs/0227.gif', 'source' => 'gymvisual'],
            'overhead-press' => ['gif' => '/storage/exercise-gifs/0091.gif', 'video' => 'https://upload.wikimedia.org/wikipedia/commons/6/69/Shoulder_press_-_exercise_demonstration_video.webm', 'source' => 'local'],
            'arnold-press' => ['gif' => '/storage/exercise-gifs/2137.gif', 'source' => 'gymvisual'],
            'lateral-raise' => ['gif' => '/storage/exercise-gifs/0334.gif', 'source' => 'gymvisual'],
            'face-pull' => ['gif' => '/storage/exercise-gifs/5203.gif', 'source' => 'local'],
            'pull-up' => ['gif' => '/storage/exercise-gifs/0652.gif', 'video' => 'https://upload.wikimedia.org/wikipedia/commons/1/15/Pull-ups_-_exercise_demonstration_video.webm', 'source' => 'gymvisual'],
            'chin-up' => ['gif' => '/storage/exercise-gifs/1326.gif', 'source' => 'gymvisual'],
            'lat-pulldown' => ['gif' => '/storage/exercise-gifs/0150.gif', 'source' => 'gymvisual'],
            'barbell-row' => ['gif' => '/storage/exercise-gifs/0027.gif', 'source' => 'gymvisual'],
            'one-arm-dumbbell-row' => ['gif' => '/storage/exercise-gifs/0292.gif', 'source' => 'gymvisual'],
            'seated-cable-row' => ['gif' => '/storage/exercise-gifs/0861.gif', 'source' => 'gymvisual'],
            't-bar-row' => ['gif' => '/storage/exercise-gifs/0606.gif', 'source' => 'gymvisual'],
            'deadlift' => ['gif' => '/storage/exercise-gifs/0032.gif', 'video' => 'https://upload.wikimedia.org/wikipedia/commons/6/62/Deadlift_-_exercise_demonstration_video.webm', 'source' => 'local'],
            'romanian-deadlift' => ['gif' => '/storage/exercise-gifs/0085.gif', 'source' => 'local'],
            'good-morning' => ['gif' => '/storage/exercise-gifs/0044.gif', 'source' => 'local'],
            'barbell-shrug' => ['gif' => '/storage/exercise-gifs/0095.gif', 'source' => 'gymvisual'],
            'farmers-carry' => ['gif' => '/storage/exercise-dataset/videos/2133-qPEzJjA.gif', 'source' => 'gymvisual'],
            'barbell-curl' => ['gif' => '/storage/exercise-dataset/videos/0031-25GPyDY.gif', 'source' => 'gymvisual'],
            'dumbbell-curl' => ['gif' => '/storage/exercise-dataset/videos/0294-NbVPDMW.gif', 'source' => 'gymvisual'],
            'hammer-curl' => ['gif' => '/storage/exercise-dataset/videos/0313-slDvUAU.gif', 'source' => 'gymvisual'],
            'preacher-curl' => ['gif' => '/storage/exercise-gifs/0070.gif', 'source' => 'local'],
            'tricep-pushdown' => ['gif' => '/storage/exercise-dataset/videos/0201-3ZflifB.gif', 'source' => 'gymvisual'],
            'skullcrusher' => ['gif' => '/storage/exercise-dataset/videos/0060-h8LFzo9.gif', 'source' => 'gymvisual'],
            'close-grip-bench-press' => ['gif' => '/storage/exercise-dataset/videos/0030-J6Dx1Mu.gif', 'source' => 'gymvisual'],
            'back-squat' => ['gif' => '/storage/exercise-dataset/videos/0043-qXTaZnJ.gif', 'video' => 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Squat_-_exercise_demonstration_video.webm', 'source' => 'gymvisual'],
            'front-squat' => ['gif' => '/storage/exercise-gifs/0042.gif', 'source' => 'local'],
            'goblet-squat' => ['gif' => '/storage/exercise-gifs/0534.gif', 'source' => 'local'],
            'bulgarian-split-squat' => ['gif' => '/storage/exercise-gifs/3533.gif', 'source' => 'local'],
            'leg-press' => ['gif' => '/storage/exercise-dataset/videos/0739-10Z2DXU.gif', 'source' => 'gymvisual'],
            'leg-extension' => ['gif' => '/storage/exercise-gifs/0585.gif', 'source' => 'local'],
            'lying-leg-curl' => ['gif' => '/storage/exercise-gifs/0586.gif', 'source' => 'local'],
            'hip-thrust' => ['gif' => '/storage/exercise-dataset/videos/3562-qg2PGl6.gif', 'source' => 'gymvisual'],
            'glute-bridge' => ['gif' => '/storage/exercise-gifs/1409.gif', 'source' => 'local'],
            'standing-calf-raise' => ['gif' => '/storage/exercise-gifs/1490.gif', 'source' => 'local'],
            'kettlebell-swing' => ['gif' => '/storage/exercise-dataset/videos/0549-UHJlbu3.gif', 'source' => 'gymvisual'],
            'plank' => ['gif' => '/storage/exercise-gifs/5202.gif', 'source' => 'local'],
            'side-plank' => ['gif' => '/storage/exercise-dataset/videos/0705-RKjH6Lt.gif', 'source' => 'gymvisual'],
            'hanging-leg-raise' => ['gif' => '/storage/exercise-dataset/videos/0472-I3tsCnC.gif', 'source' => 'gymvisual'],
            'russian-twist' => ['gif' => '/storage/exercise-dataset/videos/0687-XVDdcoj.gif', 'source' => 'gymvisual'],
            'treadmill-run' => ['gif' => '/storage/exercise-dataset/videos/0684-y5p0H8a.gif', 'source' => 'gymvisual'],
            'rowing-erg' => ['gif' => '/storage/exercise-dataset/videos/2142-vpQaQkH.gif', 'source' => 'gymvisual'],
        ];

        foreach ($rows as [$name, $muscle, $equip, $type, $desc]) {
            $slug = Str::slug($name);
            $media = $mediaMap[$slug] ?? null;
            $existing = DB::table('exercises')->where('slug', $slug)->first();

            DB::table('exercises')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'description' => $desc,
                    'instructions' => $desc,
                    'equipment_id' => $equipId($equip),
                    'primary_muscle_id' => $muscleId($muscle),
                    'secondary_muscle_ids' => null,
                    'exercise_type' => $type,
                    'gif_url' => $existing?->gif_url ?? $media['gif'] ?? null,
                    'video_url' => $existing?->video_url ?? $media['video'] ?? null,
                    'media_source' => $existing?->media_source ?? $media['source'] ?? 'local',
                    'is_system' => true,
                    'created_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
