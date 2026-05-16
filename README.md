# Gerak.in (FitLite)

A minimalist, dark-mode fitness tracker MVP built with **React Native (Expo)**.

## Features

- **Dashboard** — today's active time + completed workouts, and a daily motivational quote.
- **Workout** — exercise list (Push-ups, Squats, Planks), Sets/Reps log form, and a functional rest timer with Start / Pause / Reset.
- **Progress** — weekly Mon-Sun consistency tracker with checkmarks, a simple bar chart, and recent activity.

## Tech

- Expo + React Native
- React Navigation (Bottom Tabs)
- React Context for session-only state
- `@expo/vector-icons` (Ionicons)

## Run

```bash
cd Gerak.in
npm install
npm start
```

Scan the QR code with the **Expo Go** app on your phone, or press `a` for Android emulator / `i` for iOS simulator.

## Project Structure

```
src/
  theme/colors.js       Color tokens, spacing, radius, typography
  context/AppContext.js Global session state (workouts + weekly progress)
  components/           Reusable UI building blocks
  screens/              One file per tab
App.js                  Bottom Tab navigator + providers
```

## Customize

- **Switch accent color**: edit `src/theme/colors.js` -> `colors.accent` (`#39FF14` neon green by default; try `#00C2FF` for electric blue).
- **Add an exercise**: append to the `EXERCISES` array in `src/screens/WorkoutScreen.js`.
- **Add a quote**: append to the `QUOTES` array in `src/components/QuoteWidget.js`.
- **Persist across sessions**: replace `useState` in `src/context/AppContext.js` with a wrapper that reads/writes `@react-native-async-storage/async-storage`.
