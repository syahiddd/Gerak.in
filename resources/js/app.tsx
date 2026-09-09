import '../css/app.css';

import { applyTheme } from '@/hooks/workout';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Gerak.in';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#a3e635',
    },
});

// Apply persisted theme as early as possible (server default is system).
try {
    const stored = localStorage.getItem('gerak-theme') as 'system' | 'light' | 'dark' | null;
    applyTheme(stored ?? 'system');
} catch {
    /* ignore */
}
