# SkyCast — Weather Forecast Dashboard

A modern, production-ready Weather Dashboard SPA with real-time conditions, city/country search, and 7-day forecast.

## Quick start

```bash
npm install
npm run dev
```

Runs at **http://localhost:5173**. No API key or setup required — the app uses the **Open-Meteo** API for accurate, live temperatures (same type of data used by many weather services).

## Features

- **Current location weather** — Browser geolocation with permission prompt
- **City & country search** — e.g. London, Tokyo, India, Canada
- **7-day forecast** — Day, icon, temperature, rain probability
- **Weather details** — Feels like, pressure, visibility, wind direction
- **Glassmorphism UI** — Soft gradients, glass cards, Framer Motion animations

## Tech stack

- React 18, Vite 5, Tailwind CSS, Framer Motion, **Open-Meteo API** (free, no key required)

## Scripts

| Command     | Description        |
|------------|--------------------|
| `npm run dev`    | Start dev server   |
| `npm run build`  | Production build   |
| `npm run preview` | Preview production build |

## Project structure

```
src/
  components/   # Navbar, CurrentWeather, WeatherSearch, CityWeather, CountryWeather, Forecast, WeatherDetails, WeatherCards, Footer
  config/        # config.yaml
  styles/        # globals.css
  utils/         # weatherApi.js, locationService.js
  App.jsx, main.jsx
```
