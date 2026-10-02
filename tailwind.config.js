import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            // Workout-complete celebration (Components/social/WorkoutCelebration.tsx)
            keyframes: {
                'ring-draw': {
                    from: { strokeDashoffset: 'var(--dash)' },
                    to: { strokeDashoffset: '0' },
                },
                confetti: {
                    '0%': { transform: 'translate(-50%, -50%) rotate(0deg) scale(0.6)', opacity: '1' },
                    '75%': { opacity: '1' },
                    '100%': {
                        transform: 'translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(var(--r)) scale(1)',
                        opacity: '0',
                    },
                },
                rise: {
                    from: { opacity: '0', transform: 'translateY(14px)' },
                    to: { opacity: '1', transform: 'none' },
                },
                pop: {
                    '0%': { opacity: '0', transform: 'scale(0.6)' },
                    '60%': { opacity: '1', transform: 'scale(1.06)' },
                    '100%': { transform: 'scale(1)' },
                },
            },
            animation: {
                'ring-draw': 'ring-draw 0.9s cubic-bezier(0.65, 0, 0.35, 1) both',
                confetti: 'confetti 1.6s cubic-bezier(0.12, 0.75, 0.3, 1) both',
                rise: 'rise 0.5s ease-out both',
                pop: 'pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            },
        },
    },

    plugins: [forms],
};
