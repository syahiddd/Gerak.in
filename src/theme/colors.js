/**
 * Global theme tokens.
 *
 * Single source of truth for the dark/athletic palette.
 * Change `accent` to switch between neon green / electric blue.
 */
export const colors = {
  // Backgrounds
  background: '#0E0E10',     // app background (near-black)
  surface: '#1A1A1F',        // card surface
  surfaceAlt: '#24242B',     // pressed / secondary surface
  border: '#2A2A33',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#6B6B75',

  // Accents (swap to switch theme)
  accent: '#39FF14',         // neon green
  accentAlt: '#00C2FF',      // electric blue (used for secondary highlights)
  danger: '#FF4D6D',
  success: '#39FF14',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '500' },
};
