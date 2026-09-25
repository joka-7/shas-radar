/**
 * The AI settings dialog's provider picker, as a self-mounting island.
 *
 * static/index.html loads this as a plain `<script type="module">` next to
 * static/app.js -- the two never import each other. They agree only on two
 * things, both already documented at the boundary they cross:
 *   - the `localStorage` key this writes `AgentConfig` JSON to (app.js reads
 *     it back in `getAllAiCredentials()` for the `/api/analyze` request);
 *   - the `shas-radar:locale-changed` CustomEvent app.js dispatches on
 *     `setLocale()`, so a language switch while the dialog is open updates
 *     this picker's labels without a remount.
 * That keeps app.js free of any build step of its own -- only this widget's
 * source needs Node, and only when someone edits it (see frontend/README).
 */

import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  loadConfig,
  saveConfig,
  loadExternalChatFavorite,
  saveExternalChatFavorite,
  type AgentConfig,
  type ExternalChatProviderId,
} from "modeldispatcher-browser-agent";
import { ModelPicker, type Locale } from "modeldispatcher-react-ui";
import "modeldispatcher-react-ui/styles.css";

const CONFIG_KEYS = { config: "shas-radar:ai-config" };
const FAVORITE_KEY = "shas-radar:ai-external-chat-favorite";
const LOCALE_CHANGED_EVENT = "shas-radar:locale-changed";

function isLocale(value: string): value is Locale {
  return value === "en" || value === "fr" || value === "he";
}

function readInitialLocale(): Locale {
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : "he";
}

function Picker(): JSX.Element {
  const [locale, setLocale] = useState<Locale>(readInitialLocale);
  const [config, setConfig] = useState<AgentConfig>(() => loadConfig(undefined, CONFIG_KEYS));
  const [favorite, setFavorite] = useState<ExternalChatProviderId | null>(() =>
    loadExternalChatFavorite(undefined, FAVORITE_KEY),
  );

  useEffect(() => {
    function handleLocaleChanged(event: Event): void {
      const detail = (event as CustomEvent<unknown>).detail;
      if (typeof detail === "string" && isLocale(detail)) setLocale(detail);
    }
    window.addEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);
    return () => window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChanged);
  }, []);

  function handleConfigChange(next: AgentConfig): void {
    setConfig(next);
    saveConfig(next, undefined, CONFIG_KEYS);
  }

  function handleFavoriteChange(next: ExternalChatProviderId | null): void {
    setFavorite(next);
    saveExternalChatFavorite(next, undefined, FAVORITE_KEY);
  }

  return (
    <ModelPicker
      config={config}
      onConfigChange={handleConfigChange}
      externalChatFavorite={favorite}
      onExternalChatFavoriteChange={handleFavoriteChange}
      locale={locale}
    />
  );
}

const container = document.getElementById("ai-model-picker-root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Picker />
    </StrictMode>,
  );
}
