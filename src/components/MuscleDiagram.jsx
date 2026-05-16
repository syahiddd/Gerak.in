import styles from './MuscleDiagram.module.css';

/**
 * MuscleDiagram
 * ─────────────
 * Stylized SVG silhouette showing front + back views of the body.
 * Muscle groups passed in `active` (array of muscle keys) light up in
 * the accent color with a soft glow. Inactive muscles stay muted.
 *
 * Muscle keys used:
 *   Front view: chest, abs, obliques, shoulders, biceps, forearms, quads, calves
 *   Back view:  traps, rearDelts, triceps, lats, lowerBack, glutes, hamstrings, calves
 */
export default function MuscleDiagram({ active = [], compact = false }) {
  const set = new Set(active);
  // Helper: choose CSS class based on whether the muscle is active.
  const cls = (muscle) =>
    `${styles.muscle} ${set.has(muscle) ? styles.active : ''}`;

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      <svg
        viewBox="0 0 240 320"
        className={styles.svg}
        aria-label="Muscle group diagram"
      >
        {/* ─────────── FRONT BODY (left side, centered around x=60) ─────────── */}
        <g>
          {/* Body outline (head + torso + arms + legs) */}
          <g className={styles.outline}>
            {/* Head */}
            <circle cx="60" cy="22" r="13" />
            {/* Neck */}
            <rect x="55" y="33" width="10" height="8" rx="2" />
            {/* Torso (shoulders to waist) */}
            <path d="M30 46 Q60 40 90 46 L82 116 Q60 122 38 116 Z" />
            {/* Hips */}
            <path d="M38 116 Q60 122 82 116 L80 130 Q60 134 40 130 Z" />
            {/* Left arm */}
            <path d="M30 48 Q24 60 22 78 Q22 100 24 118 Q26 122 30 122 Q34 118 32 100 Q32 78 38 60 Z" />
            {/* Right arm */}
            <path d="M90 48 Q96 60 98 78 Q98 100 96 118 Q94 122 90 122 Q86 118 88 100 Q88 78 82 60 Z" />
            {/* Left leg */}
            <path d="M40 130 Q38 180 42 220 Q44 260 46 290 Q48 296 52 296 Q56 292 56 260 Q58 200 56 130 Z" />
            {/* Right leg */}
            <path d="M80 130 Q82 180 78 220 Q76 260 74 290 Q72 296 68 296 Q64 292 64 260 Q62 200 64 130 Z" />
          </g>

          {/* Shoulders (front delts) */}
          <ellipse className={cls('shoulders')} cx="34" cy="50" rx="7" ry="8" />
          <ellipse className={cls('shoulders')} cx="86" cy="50" rx="7" ry="8" />

          {/* Chest (two pecs) */}
          <ellipse className={cls('chest')} cx="48" cy="62" rx="11" ry="9" />
          <ellipse className={cls('chest')} cx="72" cy="62" rx="11" ry="9" />

          {/* Abs (4 blocks) */}
          <rect className={cls('abs')} x="52" y="76"  width="16" height="9" rx="2" />
          <rect className={cls('abs')} x="52" y="87"  width="16" height="9" rx="2" />
          <rect className={cls('abs')} x="52" y="98"  width="16" height="9" rx="2" />
          <rect className={cls('abs')} x="52" y="109" width="16" height="6" rx="2" />

          {/* Obliques (sides of waist) */}
          <path className={cls('obliques')} d="M40 88 Q44 100 42 116 L48 116 L50 88 Z" />
          <path className={cls('obliques')} d="M80 88 Q76 100 78 116 L72 116 L70 88 Z" />

          {/* Biceps (front of upper arm) */}
          <ellipse className={cls('biceps')} cx="27" cy="72" rx="5" ry="9" />
          <ellipse className={cls('biceps')} cx="93" cy="72" rx="5" ry="9" />

          {/* Forearms (front view) */}
          <ellipse className={cls('forearms')} cx="25" cy="100" rx="4" ry="11" />
          <ellipse className={cls('forearms')} cx="95" cy="100" rx="4" ry="11" />

          {/* Quads */}
          <ellipse className={cls('quads')} cx="49" cy="170" rx="9" ry="22" />
          <ellipse className={cls('quads')} cx="71" cy="170" rx="9" ry="22" />

          {/* Calves (front view = shins, but we still highlight) */}
          <ellipse className={cls('calves')} cx="49" cy="245" rx="6" ry="14" />
          <ellipse className={cls('calves')} cx="71" cy="245" rx="6" ry="14" />
        </g>

        {/* ─────────── BACK BODY (right side, centered around x=180) ─────────── */}
        <g transform="translate(120 0)">
          {/* Body outline */}
          <g className={styles.outline}>
            <circle cx="60" cy="22" r="13" />
            <rect x="55" y="33" width="10" height="8" rx="2" />
            <path d="M30 46 Q60 40 90 46 L82 116 Q60 122 38 116 Z" />
            <path d="M38 116 Q60 122 82 116 L80 130 Q60 134 40 130 Z" />
            <path d="M30 48 Q24 60 22 78 Q22 100 24 118 Q26 122 30 122 Q34 118 32 100 Q32 78 38 60 Z" />
            <path d="M90 48 Q96 60 98 78 Q98 100 96 118 Q94 122 90 122 Q86 118 88 100 Q88 78 82 60 Z" />
            <path d="M40 130 Q38 180 42 220 Q44 260 46 290 Q48 296 52 296 Q56 292 56 260 Q58 200 56 130 Z" />
            <path d="M80 130 Q82 180 78 220 Q76 260 74 290 Q72 296 68 296 Q64 292 64 260 Q62 200 64 130 Z" />
          </g>

          {/* Rear delts */}
          <ellipse className={cls('rearDelts')} cx="34" cy="50" rx="7" ry="8" />
          <ellipse className={cls('rearDelts')} cx="86" cy="50" rx="7" ry="8" />

          {/* Traps (between shoulders, top of back) */}
          <path className={cls('traps')} d="M44 46 Q60 42 76 46 L72 64 Q60 60 48 64 Z" />

          {/* Lats (V-shape down the back) */}
          <path className={cls('lats')} d="M40 60 Q34 80 38 105 L52 100 L50 64 Z" />
          <path className={cls('lats')} d="M80 60 Q86 80 82 105 L68 100 L70 64 Z" />

          {/* Lower back */}
          <rect className={cls('lowerBack')} x="48" y="100" width="24" height="14" rx="3" />

          {/* Triceps (back of upper arm) */}
          <ellipse className={cls('triceps')} cx="27" cy="72" rx="5" ry="9" />
          <ellipse className={cls('triceps')} cx="93" cy="72" rx="5" ry="9" />

          {/* Forearms (back) */}
          <ellipse className={cls('forearms')} cx="25" cy="100" rx="4" ry="11" />
          <ellipse className={cls('forearms')} cx="95" cy="100" rx="4" ry="11" />

          {/* Glutes */}
          <ellipse className={cls('glutes')} cx="50" cy="138" rx="9" ry="8" />
          <ellipse className={cls('glutes')} cx="70" cy="138" rx="9" ry="8" />

          {/* Hamstrings */}
          <ellipse className={cls('hamstrings')} cx="49" cy="180" rx="9" ry="20" />
          <ellipse className={cls('hamstrings')} cx="71" cy="180" rx="9" ry="20" />

          {/* Calves (back view = main calf muscle) */}
          <ellipse className={cls('calves')} cx="49" cy="240" rx="7" ry="16" />
          <ellipse className={cls('calves')} cx="71" cy="240" rx="7" ry="16" />
        </g>

        {/* View labels */}
        <text x="60" y="315" textAnchor="middle" className={styles.label}>FRONT</text>
        <text x="180" y="315" textAnchor="middle" className={styles.label}>BACK</text>
      </svg>

      {/* Active muscles legend */}
      {active.length > 0 && (
        <div className={styles.legend}>
          {active.map((m) => (
            <span key={m} className={styles.legendChip}>
              {muscleLabel(m)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Pretty-print muscle keys for the legend chips.
function muscleLabel(key) {
  const map = {
    chest: 'Chest',
    abs: 'Abs',
    obliques: 'Obliques',
    shoulders: 'Shoulders',
    rearDelts: 'Rear Delts',
    traps: 'Traps',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Forearms',
    lats: 'Lats',
    lowerBack: 'Lower Back',
    quads: 'Quads',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    calves: 'Calves',
  };
  return map[key] || key;
}
