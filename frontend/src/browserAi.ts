/**
 * Runs an analysis in the visitor's browser with their own key(s), so the key
 * never reaches the shas-radar server.
 *
 * Built as its own small entry, static/vendor/model-picker/browser-ai.js (no
 * React), which static/app.js loads with a dynamic `import()` the first time
 * an analysis runs -- the picker bundle itself only loads when the settings
 * dialog opens, so this can't live there. The server still builds the
 * prompt (POST /api/analyze/prompt); this only sends it to the vendor.
 */

import {
  AllProvidersExhaustedError,
  NoProviderConfiguredError,
  complete,
  isConfigReady,
  loadConfig,
  type AgentConfig,
  type ChatMessage,
} from "modeldispatcher-browser-agent";

/** The localStorage key the picker (main.tsx) writes the visitor's config to. */
const CONFIG_KEYS = { config: "shas-radar:ai-config" };

/** Same cap the server used when it made these calls (app/ai.py). */
const MAX_TOKENS = 500;

/** A failure app.js can show: `code` matches its `connections.error.code.*` keys. */
export class BrowserAiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BrowserAiError";
    this.code = code;
  }
}

/** What app.js calls; see the module comment. */
export interface BrowserAi {
  /** True when the visitor configured a provider this browser can call. */
  hasOwnKey(): boolean;
  /** Sends a prompt from /api/analyze/prompt with the visitor's key; resolves to the answer text. */
  complete(prompt: unknown): Promise<string>;
}

interface AnalysisPrompt {
  readonly system: string;
  readonly messages: readonly ChatMessage[];
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const { role, content } = value as Record<string, unknown>;
  return (role === "user" || role === "assistant") && typeof content === "string";
}

/** The prompt comes over the network, so its shape is checked, not assumed. */
function parsePrompt(value: unknown): AnalysisPrompt {
  if (typeof value === "object" && value !== null) {
    const { system, messages } = value as Record<string, unknown>;
    if (typeof system === "string" && Array.isArray(messages) && messages.every(isChatMessage)) {
      return { system, messages };
    }
  }
  throw new BrowserAiError("invalid_prompt", "The server returned an unexpected analysis prompt.");
}

function toBrowserAiError(err: unknown): BrowserAiError {
  if (err instanceof BrowserAiError) return err;
  if (err instanceof NoProviderConfiguredError)
    return new BrowserAiError("no_credential", err.message);
  if (err instanceof AllProvidersExhaustedError) {
    return new BrowserAiError("all_providers_exhausted", err.message);
  }
  return new BrowserAiError("provider_error", err instanceof Error ? err.message : String(err));
}

/** Builds the bridge over a config source, so it can be exercised without localStorage. */
export function createBrowserAi(readConfig: () => AgentConfig): BrowserAi {
  return {
    hasOwnKey: () => isConfigReady(readConfig()),
    async complete(prompt) {
      try {
        const { system, messages } = parsePrompt(prompt);
        return await complete(readConfig(), messages, {
          systemInstruction: system,
          maxTokens: MAX_TOKENS,
        });
      } catch (err) {
        throw toBrowserAiError(err);
      }
    },
  };
}

const browserAi = createBrowserAi(() => loadConfig(undefined, CONFIG_KEYS));

/** True when the visitor configured a provider this browser can call. */
export function hasOwnKey(): boolean {
  return browserAi.hasOwnKey();
}

/** Sends a prompt from /api/analyze/prompt with the visitor's key; resolves to the answer text. */
export function completeAnalysis(prompt: unknown): Promise<string> {
  return browserAi.complete(prompt);
}
