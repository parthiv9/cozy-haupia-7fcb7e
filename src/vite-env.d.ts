/// <reference types="vite/client" />

/**
 * Vite exposes env vars prefixed with VITE_ to client code via import.meta.env.
 * @see https://vitejs.dev/guide/env-and-mode.html
 */
interface ImportMetaEnv {
  /**
   * OpenWeatherMap API key for map tiles (temp, clouds, precipitation).
   * Define in `.env` as `VITE_OPENWEATHER_API_KEY=...` — optional; radar works without it.
   */
  readonly VITE_OPENWEATHER_API_KEY?: string;
  /** Optional NewsAPI.org key — weather news (`/v2/everything`) (see https://newsapi.org/) */
  readonly VITE_NEWS_API_KEY?: string;
  /** Optional GNews.io key — weather search (see https://gnews.io/) */
  readonly VITE_GNEWS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Contact Picker API (Chromium / Android WebView); optional on `navigator`. */
interface ContactsContact {
  name?: string;
  tel?: string | ContactsPhone[];
  email?: string | ContactsEmail[];
}

interface ContactsPhone {
  value?: string;
  valueNumber?: string;
}

interface ContactsEmail {
  value?: string;
}

interface ContactsManager {
  select(properties: string[], options?: { multiple?: boolean }): Promise<ContactsContact[]>;
}

interface Navigator {
  contacts?: ContactsManager;
}
