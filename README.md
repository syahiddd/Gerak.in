# Gerak.in (FitLite) - Web

A minimalist, dark-mode fitness tracker MVP built with **React + Vite** for the web.

## Features

- **Dashboard** - today's active time + completed workouts, plus a daily motivational quote.
- **Workout** - exercise list (Push-ups, Squats, Planks), Sets/Reps log form, and a functional rest timer with Start / Pause / Reset (plays a beep when finished).
- **Progress** - weekly Mon-Sun consistency tracker with checkmarks, a simple bar chart, and a recent-activity feed.

## Tech

- React 18 + Vite
- React Context for session-only state
- CSS Modules + CSS variables for theming
- `lucide-react` for icons

## Run

```bash
cd Gerak.in
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

## Project Structure

```
index.html              Vite entry
vite.config.js
src/
  main.jsx              Mounts <App> + <AppProvider>
  App.jsx               Bottom tab "router"
  styles/global.css     Theme tokens (CSS variables)
  context/AppContext.jsx Global session state
  components/           Card, SummaryCard, QuoteWidget,
                        ExerciseItem, LogWorkoutForm, RestTimer,
                        WeeklyTracker (.jsx + .module.css each)
  screens/              DashboardScreen, WorkoutScreen, ProgressScreen
```

The app is rendered inside a centered, phone-shaped column (max-width 480px) so it feels native on mobile and looks like a "phone preview" on desktop.

## Customize

- **Switch accent color**: edit `src/styles/global.css` -> `--accent` (`#39FF14` neon green by default; try `#00C2FF` for electric blue).
- **Add an exercise**: append to the `EXERCISES` array in `src/screens/WorkoutScreen.jsx`.
- **Add a quote**: append to the `QUOTES` array in `src/components/QuoteWidget.jsx`.
- **Persist across reloads**: replace `useState` in `src/context/AppContext.jsx` with a wrapper that reads/writes `localStorage`.
