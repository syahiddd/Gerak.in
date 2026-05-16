/**
 * exercises.js
 * =============
 * Master database of 100+ exercises grouped by category.
 * Each entry has: id, name, category, equipment, and muscle targets.
 *
 * Categories:
 *  - Chest, Back, Shoulders, Arms (Biceps/Triceps), Legs, Core,
 *    Full Body, Calisthenics, Cardio
 */

const EXERCISES = [
  // ─── CHEST ──────────────────────────────────────────
  { id: 'bench-press', name: 'Bench Press', category: 'Chest', equipment: 'Barbell', target: 'Chest • Triceps' },
  { id: 'incline-bench-press', name: 'Incline Bench Press', category: 'Chest', equipment: 'Barbell', target: 'Upper Chest • Shoulders' },
  { id: 'decline-bench-press', name: 'Decline Bench Press', category: 'Chest', equipment: 'Barbell', target: 'Lower Chest • Triceps' },
  { id: 'dumbbell-press', name: 'Dumbbell Chest Press', category: 'Chest', equipment: 'Dumbbell', target: 'Chest • Triceps' },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', category: 'Chest', equipment: 'Dumbbell', target: 'Upper Chest' },
  { id: 'dumbbell-flyes', name: 'Dumbbell Flyes', category: 'Chest', equipment: 'Dumbbell', target: 'Chest' },
  { id: 'cable-flyes', name: 'Cable Flyes', category: 'Chest', equipment: 'Cable', target: 'Chest' },
  { id: 'pec-deck', name: 'Pec Deck Machine', category: 'Chest', equipment: 'Machine', target: 'Chest' },
  { id: 'chest-dips', name: 'Chest Dips', category: 'Chest', equipment: 'Bodyweight', target: 'Lower Chest • Triceps' },
  { id: 'push-ups', name: 'Push-ups', category: 'Chest', equipment: 'Bodyweight', target: 'Chest • Triceps' },
  { id: 'landmine-press', name: 'Landmine Press', category: 'Chest', equipment: 'Barbell', target: 'Upper Chest • Shoulders' },
  { id: 'smith-bench-press', name: 'Smith Machine Bench Press', category: 'Chest', equipment: 'Machine', target: 'Chest • Triceps' },

  // ─── BACK ───────────────────────────────────────────
  { id: 'deadlift', name: 'Deadlift', category: 'Back', equipment: 'Barbell', target: 'Back • Hamstrings • Glutes' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'Back', equipment: 'Barbell', target: 'Back • Biceps' },
  { id: 'dumbbell-row', name: 'Dumbbell Row', category: 'Back', equipment: 'Dumbbell', target: 'Back • Biceps' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', equipment: 'Cable', target: 'Lats • Biceps' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', category: 'Back', equipment: 'Cable', target: 'Back • Biceps' },
  { id: 't-bar-row', name: 'T-Bar Row', category: 'Back', equipment: 'Barbell', target: 'Mid Back • Lats' },
  { id: 'pull-ups', name: 'Pull-ups', category: 'Back', equipment: 'Bodyweight', target: 'Lats • Biceps' },
  { id: 'chin-ups', name: 'Chin-ups', category: 'Back', equipment: 'Bodyweight', target: 'Lats • Biceps' },
  { id: 'face-pulls', name: 'Face Pulls', category: 'Back', equipment: 'Cable', target: 'Rear Delts • Traps' },
  { id: 'hyperextension', name: 'Hyperextension', category: 'Back', equipment: 'Bodyweight', target: 'Lower Back • Glutes' },
  { id: 'rack-pull', name: 'Rack Pull', category: 'Back', equipment: 'Barbell', target: 'Upper Back • Traps' },
  { id: 'pendlay-row', name: 'Pendlay Row', category: 'Back', equipment: 'Barbell', target: 'Back • Lats' },
  { id: 'cable-pullover', name: 'Cable Pullover', category: 'Back', equipment: 'Cable', target: 'Lats • Chest' },
  { id: 'inverted-row', name: 'Inverted Row', category: 'Back', equipment: 'Bodyweight', target: 'Back • Biceps' },

  // ─── SHOULDERS ──────────────────────────────────────
  { id: 'overhead-press', name: 'Overhead Press', category: 'Shoulders', equipment: 'Barbell', target: 'Shoulders • Triceps' },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'Shoulders', equipment: 'Dumbbell', target: 'Shoulders • Triceps' },
  { id: 'arnold-press', name: 'Arnold Press', category: 'Shoulders', equipment: 'Dumbbell', target: 'Shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'Shoulders', equipment: 'Dumbbell', target: 'Side Delts' },
  { id: 'front-raise', name: 'Front Raise', category: 'Shoulders', equipment: 'Dumbbell', target: 'Front Delts' },
  { id: 'rear-delt-flyes', name: 'Rear Delt Flyes', category: 'Shoulders', equipment: 'Dumbbell', target: 'Rear Delts' },
  { id: 'upright-row', name: 'Upright Row', category: 'Shoulders', equipment: 'Barbell', target: 'Shoulders • Traps' },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', category: 'Shoulders', equipment: 'Cable', target: 'Side Delts' },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', category: 'Shoulders', equipment: 'Machine', target: 'Shoulders' },
  { id: 'shrugs', name: 'Barbell Shrugs', category: 'Shoulders', equipment: 'Barbell', target: 'Traps' },
  { id: 'dumbbell-shrugs', name: 'Dumbbell Shrugs', category: 'Shoulders', equipment: 'Dumbbell', target: 'Traps' },
  { id: 'pike-push-ups', name: 'Pike Push-ups', category: 'Shoulders', equipment: 'Bodyweight', target: 'Shoulders' },
  { id: 'handstand-push-ups', name: 'Handstand Push-ups', category: 'Shoulders', equipment: 'Bodyweight', target: 'Shoulders • Triceps' },

  // ─── ARMS (BICEPS) ─────────────────────────────────
  { id: 'barbell-curl', name: 'Barbell Curl', category: 'Arms', equipment: 'Barbell', target: 'Biceps' },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', category: 'Arms', equipment: 'Dumbbell', target: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'Arms', equipment: 'Dumbbell', target: 'Biceps • Brachialis' },
  { id: 'preacher-curl', name: 'Preacher Curl', category: 'Arms', equipment: 'Barbell', target: 'Biceps' },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', category: 'Arms', equipment: 'Dumbbell', target: 'Biceps (stretch)' },
  { id: 'concentration-curl', name: 'Concentration Curl', category: 'Arms', equipment: 'Dumbbell', target: 'Biceps (peak)' },
  { id: 'cable-curl', name: 'Cable Curl', category: 'Arms', equipment: 'Cable', target: 'Biceps' },
  { id: 'ez-bar-curl', name: 'EZ-Bar Curl', category: 'Arms', equipment: 'Barbell', target: 'Biceps' },

  // ─── ARMS (TRICEPS) ────────────────────────────────
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Arms', equipment: 'Cable', target: 'Triceps' },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', category: 'Arms', equipment: 'Dumbbell', target: 'Triceps (long head)' },
  { id: 'skull-crushers', name: 'Skull Crushers', category: 'Arms', equipment: 'Barbell', target: 'Triceps' },
  { id: 'close-grip-bench-press', name: 'Close-Grip Bench Press', category: 'Arms', equipment: 'Barbell', target: 'Triceps • Chest' },
  { id: 'dips-triceps', name: 'Tricep Dips', category: 'Arms', equipment: 'Bodyweight', target: 'Triceps' },
  { id: 'diamond-push-ups', name: 'Diamond Push-ups', category: 'Arms', equipment: 'Bodyweight', target: 'Triceps • Chest' },
  { id: 'kickbacks', name: 'Tricep Kickbacks', category: 'Arms', equipment: 'Dumbbell', target: 'Triceps' },
  { id: 'rope-pushdown', name: 'Rope Pushdown', category: 'Arms', equipment: 'Cable', target: 'Triceps' },

  // ─── ARMS (FOREARMS) ───────────────────────────────
  { id: 'wrist-curl', name: 'Wrist Curl', category: 'Arms', equipment: 'Barbell', target: 'Forearms' },
  { id: 'reverse-wrist-curl', name: 'Reverse Wrist Curl', category: 'Arms', equipment: 'Barbell', target: 'Forearms' },
  { id: 'farmers-walk', name: "Farmer's Walk", category: 'Arms', equipment: 'Dumbbell', target: 'Forearms • Traps • Core' },

  // ─── LEGS ───────────────────────────────────────────
  { id: 'barbell-squat', name: 'Barbell Squat', category: 'Legs', equipment: 'Barbell', target: 'Quads • Glutes' },
  { id: 'front-squat', name: 'Front Squat', category: 'Legs', equipment: 'Barbell', target: 'Quads • Core' },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', equipment: 'Machine', target: 'Quads • Glutes' },
  { id: 'hack-squat', name: 'Hack Squat', category: 'Legs', equipment: 'Machine', target: 'Quads' },
  { id: 'lunges', name: 'Lunges', category: 'Legs', equipment: 'Bodyweight', target: 'Quads • Glutes' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Legs', equipment: 'Dumbbell', target: 'Quads • Glutes' },
  { id: 'leg-extension', name: 'Leg Extension', category: 'Legs', equipment: 'Machine', target: 'Quads' },
  { id: 'leg-curl', name: 'Leg Curl', category: 'Legs', equipment: 'Machine', target: 'Hamstrings' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Legs', equipment: 'Barbell', target: 'Hamstrings • Glutes' },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', category: 'Legs', equipment: 'Barbell', target: 'Quads • Glutes • Adductors' },
  { id: 'calf-raise-standing', name: 'Standing Calf Raise', category: 'Legs', equipment: 'Machine', target: 'Calves' },
  { id: 'calf-raise-seated', name: 'Seated Calf Raise', category: 'Legs', equipment: 'Machine', target: 'Calves (soleus)' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Legs', equipment: 'Dumbbell', target: 'Quads • Glutes' },
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'Legs', equipment: 'Barbell', target: 'Glutes • Hamstrings' },
  { id: 'step-ups', name: 'Step Ups', category: 'Legs', equipment: 'Dumbbell', target: 'Quads • Glutes' },
  { id: 'walking-lunges', name: 'Walking Lunges', category: 'Legs', equipment: 'Dumbbell', target: 'Quads • Glutes' },
  { id: 'sissy-squat', name: 'Sissy Squat', category: 'Legs', equipment: 'Bodyweight', target: 'Quads' },
  { id: 'pistol-squat', name: 'Pistol Squat', category: 'Legs', equipment: 'Bodyweight', target: 'Quads • Balance' },

  // ─── CORE ───────────────────────────────────────────
  { id: 'plank', name: 'Plank', category: 'Core', equipment: 'Bodyweight', target: 'Core' },
  { id: 'crunches', name: 'Crunches', category: 'Core', equipment: 'Bodyweight', target: 'Abs' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', category: 'Core', equipment: 'Bodyweight', target: 'Abs • Obliques' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'Core', equipment: 'Bodyweight', target: 'Lower Abs • Hip Flexors' },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', category: 'Core', equipment: 'Ab Wheel', target: 'Abs • Core' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'Core', equipment: 'Bodyweight', target: 'Obliques' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'Core', equipment: 'Bodyweight', target: 'Core • Cardio' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'Core', equipment: 'Bodyweight', target: 'Core (stability)' },
  { id: 'cable-woodchop', name: 'Cable Woodchop', category: 'Core', equipment: 'Cable', target: 'Obliques • Core' },
  { id: 'v-ups', name: 'V-Ups', category: 'Core', equipment: 'Bodyweight', target: 'Abs' },
  { id: 'side-plank', name: 'Side Plank', category: 'Core', equipment: 'Bodyweight', target: 'Obliques' },
  { id: 'flutter-kicks', name: 'Flutter Kicks', category: 'Core', equipment: 'Bodyweight', target: 'Lower Abs' },
  { id: 'dragon-flag', name: 'Dragon Flag', category: 'Core', equipment: 'Bodyweight', target: 'Abs • Core' },
  { id: 'pallof-press', name: 'Pallof Press', category: 'Core', equipment: 'Cable', target: 'Core (anti-rotation)' },

  // ─── FULL BODY ──────────────────────────────────────
  { id: 'clean-and-press', name: 'Clean and Press', category: 'Full Body', equipment: 'Barbell', target: 'Full Body' },
  { id: 'thrusters', name: 'Thrusters', category: 'Full Body', equipment: 'Barbell', target: 'Legs • Shoulders' },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', category: 'Full Body', equipment: 'Kettlebell', target: 'Glutes • Hamstrings • Core' },
  { id: 'snatch', name: 'Snatch', category: 'Full Body', equipment: 'Barbell', target: 'Full Body (explosive)' },
  { id: 'clean-and-jerk', name: 'Clean and Jerk', category: 'Full Body', equipment: 'Barbell', target: 'Full Body (explosive)' },
  { id: 'turkish-getup', name: 'Turkish Get-up', category: 'Full Body', equipment: 'Kettlebell', target: 'Full Body • Stability' },
  { id: 'battle-ropes', name: 'Battle Ropes', category: 'Full Body', equipment: 'Ropes', target: 'Arms • Core • Cardio' },
  { id: 'sled-push', name: 'Sled Push', category: 'Full Body', equipment: 'Sled', target: 'Legs • Core • Conditioning' },

  // ─── CALISTHENICS ───────────────────────────────────
  { id: 'muscle-ups', name: 'Muscle-ups', category: 'Calisthenics', equipment: 'Bar', target: 'Back • Chest • Arms' },
  { id: 'dips-cali', name: 'Dips (Parallel Bar)', category: 'Calisthenics', equipment: 'Bar', target: 'Chest • Triceps' },
  { id: 'l-sit', name: 'L-Sit', category: 'Calisthenics', equipment: 'Bodyweight', target: 'Core • Hip Flexors' },
  { id: 'front-lever', name: 'Front Lever (Hold)', category: 'Calisthenics', equipment: 'Bar', target: 'Back • Core' },
  { id: 'back-lever', name: 'Back Lever (Hold)', category: 'Calisthenics', equipment: 'Bar', target: 'Shoulders • Back' },
  { id: 'planche-push-up', name: 'Planche Push-up', category: 'Calisthenics', equipment: 'Bodyweight', target: 'Shoulders • Chest • Core' },
  { id: 'human-flag', name: 'Human Flag (Hold)', category: 'Calisthenics', equipment: 'Bar', target: 'Obliques • Shoulders' },
  { id: 'skin-the-cat', name: 'Skin the Cat', category: 'Calisthenics', equipment: 'Rings', target: 'Shoulders • Back' },
  { id: 'ring-dips', name: 'Ring Dips', category: 'Calisthenics', equipment: 'Rings', target: 'Chest • Triceps • Stability' },
  { id: 'ring-rows', name: 'Ring Rows', category: 'Calisthenics', equipment: 'Rings', target: 'Back • Biceps' },
  { id: 'archer-push-ups', name: 'Archer Push-ups', category: 'Calisthenics', equipment: 'Bodyweight', target: 'Chest • Triceps' },
  { id: 'one-arm-push-up', name: 'One-Arm Push-up', category: 'Calisthenics', equipment: 'Bodyweight', target: 'Chest • Core' },
  { id: 'clap-push-ups', name: 'Clap Push-ups', category: 'Calisthenics', equipment: 'Bodyweight', target: 'Chest (explosive)' },
  { id: 'typewriter-pull-ups', name: 'Typewriter Pull-ups', category: 'Calisthenics', equipment: 'Bar', target: 'Lats • Biceps' },
  { id: 'commando-pull-ups', name: 'Commando Pull-ups', category: 'Calisthenics', equipment: 'Bar', target: 'Lats • Core' },
  { id: 'handstand-hold', name: 'Handstand Hold', category: 'Calisthenics', equipment: 'Bodyweight', target: 'Shoulders • Balance' },
  { id: 'dragon-flag-cali', name: 'Dragon Flag', category: 'Calisthenics', equipment: 'Bench', target: 'Abs • Core' },
  { id: 'pseudo-planche-push-ups', name: 'Pseudo Planche Push-ups', category: 'Calisthenics', equipment: 'Bodyweight', target: 'Shoulders • Chest' },

  // ─── CARDIO ─────────────────────────────────────────
  { id: 'burpees', name: 'Burpees', category: 'Cardio', equipment: 'Bodyweight', target: 'Full Body • Cardio' },
  { id: 'jumping-jacks', name: 'Jumping Jacks', category: 'Cardio', equipment: 'Bodyweight', target: 'Cardio • Full Body' },
  { id: 'high-knees', name: 'High Knees', category: 'Cardio', equipment: 'Bodyweight', target: 'Cardio • Legs' },
  { id: 'box-jumps', name: 'Box Jumps', category: 'Cardio', equipment: 'Box', target: 'Legs (explosive) • Cardio' },
  { id: 'jump-rope', name: 'Jump Rope', category: 'Cardio', equipment: 'Jump Rope', target: 'Cardio • Calves' },
  { id: 'rowing-machine', name: 'Rowing Machine', category: 'Cardio', equipment: 'Machine', target: 'Full Body • Cardio' },
  { id: 'assault-bike', name: 'Assault Bike', category: 'Cardio', equipment: 'Machine', target: 'Full Body • Cardio' },
  { id: 'sprints', name: 'Sprints', category: 'Cardio', equipment: 'Bodyweight', target: 'Legs • Cardio' },
  { id: 'stair-climber', name: 'Stair Climber', category: 'Cardio', equipment: 'Machine', target: 'Legs • Cardio' },
  { id: 'treadmill-incline', name: 'Treadmill Incline Walk', category: 'Cardio', equipment: 'Machine', target: 'Legs • Cardio (low impact)' },
];

// Derive category list from the data itself.
export const CATEGORIES = ['All', ...new Set(EXERCISES.map((e) => e.category))];

export default EXERCISES;
