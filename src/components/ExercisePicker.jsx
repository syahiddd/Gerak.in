import { useState, useMemo } from 'react';
import { Search, Circle, CheckCircle2 } from 'lucide-react';
import EXERCISES, { CATEGORIES } from '../data/exercises.js';
import Card from './Card.jsx';
import styles from './ExercisePicker.module.css';

/**
 * ExercisePicker
 * ──────────────
 * Searchable, category-filterable exercise list.
 * - Displays 120+ exercises with live search.
 * - Category chips for quick filtering.
 * - Calls `onSelect(exercise)` when user picks one.
 */
export default function ExercisePicker({ selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Filter exercises by category + search query.
  const filtered = useMemo(() => {
    let result = EXERCISES;

    // Category filter
    if (category !== 'All') {
      result = result.filter((e) => e.category === category);
    }

    // Search filter (fuzzy: checks name, target, equipment)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q) ||
          e.equipment.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, category]);

  return (
    <Card>
      <div className={styles.wrapper}>
        {/* Search bar */}
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Category tabs (horizontal scroll) */}
        <div className={styles.categoryBar}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`${styles.categoryChip} ${
                category === cat ? styles.categoryChipActive : ''
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span className={styles.countBadge}>
          {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
        </span>

        {/* Scrollable exercise list */}
        <div className={styles.list}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>
              No exercises match your search. Try a different keyword.
            </p>
          ) : (
            filtered.map((ex) => {
              const isSelected = ex.id === selectedId;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => onSelect(ex)}
                  className={`${styles.exerciseRow} ${
                    isSelected ? styles.exerciseRowSelected : ''
                  }`}
                >
                  <div className={styles.exerciseInfo}>
                    <span className={styles.exerciseName}>{ex.name}</span>
                    <span className={styles.exerciseMeta}>{ex.target}</span>
                  </div>
                  <span className={styles.exerciseEquip}>{ex.equipment}</span>
                  {isSelected ? (
                    <CheckCircle2 size={18} className={`${styles.radio} ${styles.radioActive}`} />
                  ) : (
                    <Circle size={18} className={styles.radio} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
