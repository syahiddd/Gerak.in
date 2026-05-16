import { useMemo } from 'react';
import Card from './Card.jsx';
import styles from './QuoteWidget.module.css';

// Built-in quote pool. Add more or fetch from an API later.
const QUOTES = [
  'Push yourself, because no one else is going to do it for you.',
  'The body achieves what the mind believes.',
  'Sweat is just fat crying.',
  'Small steps every day.',
  'Discipline > motivation.',
  "You don't have to be extreme, just consistent.",
  'Your only competition is who you were yesterday.',
];

/**
 * Picks a quote based on the day of the year so it stays
 * stable for a whole day but rotates daily.
 */
export default function QuoteWidget() {
  const quote = useMemo(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date() - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  return (
    <Card accentBorder>
      <p className={styles.label}>Daily Motivation</p>
      <p className={styles.quote}>&ldquo;{quote}&rdquo;</p>
    </Card>
  );
}
