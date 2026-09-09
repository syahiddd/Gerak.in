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

        foreach ($rows as [$name, $muscle, $equip, $type, $desc]) {
            DB::table('exercises')->updateOrInsert(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => $desc,
                    'instructions' => $desc,
                    'equipment_id' => $equipId($equip),
                    'primary_muscle_id' => $muscleId($muscle),
                    'secondary_muscle_ids' => null,
                    'exercise_type' => $type,
                    'is_system' => true,
                    'created_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
