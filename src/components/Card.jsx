import styles from './Card.module.css';

/**
 * Reusable rounded surface used by every "card" UI block.
 * `accentBorder` adds a left accent stripe (used by the quote widget).
 */
export default function Card({ children, accentBorder = false, className = '', style }) {
  const cls = [
    styles.card,
    accentBorder && styles.accentBorder,
    className,
  ].filter(Boolean).join(' ');
  return <div className={cls} style={style}>{children}</div>;
}
