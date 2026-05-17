import styles from './ExerciseAnimation.module.css';

/**
 * ExerciseAnimation
 * ─────────────────
 * Renders a CSS-animated stick-figure illustration showing the movement
 * pattern for a given exercise. Animations are categorized by movement type
 * (push, pull, squat, plank, curl, press, etc.) so that each exercise maps
 * to a relevant motion without needing 120+ unique animations.
 *
 * Movement categories:
 *  - push       (push-ups, bench press, chest dips, etc.)
 *  - pull       (pull-ups, rows, lat pulldown, etc.)
 *  - squat      (squats, leg press, lunges, etc.)
 *  - deadlift   (deadlift, RDL, hip thrust, etc.)
 *  - press      (overhead press, shoulder press, etc.)
 *  - curl       (bicep curls, hammer curls, etc.)
 *  - extension  (tricep pushdown, skull crushers, etc.)
 *  - plank      (plank, side plank, dead bug, etc.)
 *  - crunch     (crunches, v-ups, leg raise, etc.)
 *  - cardio     (burpees, jumping jacks, sprints, etc.)
 *  - raise      (lateral raise, front raise, etc.)
 *  - calf       (calf raises)
 *  - swing      (kettlebell swing, clean, etc.)
 *  - hold       (L-sit, front lever, handstand, etc.)
 */

// Map exercise IDs or categories/keywords to movement animation types.
function getMovementType(exercise) {
  if (!exercise) return 'push';
  const name = exercise.name.toLowerCase();
  const target = exercise.target.toLowerCase();
  const cat = exercise.category.toLowerCase();

  // Specific name-based matches first
  if (name.includes('plank') || name.includes('dead bug')) return 'plank';
  if (name.includes('crunch') || name.includes('v-up') || name.includes('flutter') || name.includes('leg raise') || name.includes('dragon flag')) return 'crunch';
  if (name.includes('curl') && !name.includes('leg curl')) return 'curl';
  if (name.includes('deadlift') || name.includes('hip thrust') || name.includes('hyperextension')) return 'deadlift';
  if (name.includes('squat') || name.includes('lunge') || name.includes('leg press') || name.includes('step up') || name.includes('hack')) return 'squat';
  if (name.includes('push-up') || name.includes('push up') || name.includes('bench press') || name.includes('dips') || name.includes('flye') || name.includes('pec deck')) return 'push';
  if (name.includes('pull-up') || name.includes('pull up') || name.includes('chin-up') || name.includes('row') || name.includes('pulldown') || name.includes('pullover')) return 'pull';
  if (name.includes('overhead') || name.includes('shoulder press') || name.includes('arnold') || name.includes('handstand') || name.includes('pike') || name.includes('press') && target.includes('shoulder')) return 'press';
  if (name.includes('lateral raise') || name.includes('front raise') || name.includes('rear delt')) return 'raise';
  if (name.includes('tricep') || name.includes('pushdown') || name.includes('skull') || name.includes('extension') || name.includes('kickback') || name.includes('diamond')) return 'extension';
  if (name.includes('calf') || name.includes('calf raise')) return 'calf';
  if (name.includes('swing') || name.includes('clean') || name.includes('snatch') || name.includes('thruster') || name.includes('jerk')) return 'swing';
  if (name.includes('l-sit') || name.includes('lever') || name.includes('flag') || name.includes('hold') || name.includes('planche')) return 'hold';
  if (name.includes('burpee') || name.includes('jump') || name.includes('sprint') || name.includes('high knee') || name.includes('mountain') || name.includes('rope') || name.includes('rowing') || name.includes('bike') || name.includes('stair') || name.includes('treadmill')) return 'cardio';

  // Category-based fallbacks
  if (cat === 'cardio') return 'cardio';
  if (cat === 'core') return 'crunch';
  if (cat === 'legs') return 'squat';
  if (cat === 'back') return 'pull';
  if (cat === 'chest') return 'push';
  if (cat === 'shoulders') return 'press';
  if (cat === 'arms') return 'curl';
  if (cat === 'calisthenics') return 'pull';
  if (cat === 'full body') return 'swing';

  return 'push'; // default
}

export default function ExerciseAnimation({ exercise }) {
  const movement = getMovementType(exercise);

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.scene} ${styles[movement]}`}>
        {/* Stick figure body */}
        <div className={styles.figure}>
          <div className={styles.head} />
          <div className={styles.torso} />
          <div className={styles.armLeft} />
          <div className={styles.armRight} />
          <div className={styles.legLeft} />
          <div className={styles.legRight} />
          {/* Weight indicator for applicable movements */}
          {['push', 'press', 'curl', 'deadlift', 'squat', 'swing', 'extension'].includes(movement) && (
            <div className={styles.weight} />
          )}
        </div>
      </div>
      <span className={styles.movementLabel}>{movement.toUpperCase()}</span>
    </div>
  );
}
