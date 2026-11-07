const s = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    free: !1,
    defaultModel: "gemini-2.0-flash",
    placeholder: "AIza...",
    infoUrl: "https://aistudio.google.com/app/apikey",
    infoText: "Get a free key from Google AI Studio"
  },
  groq: {
    id: "groq",
    name: "Groq",
    free: !0,
    defaultModel: "llama-3.1-8b-instant",
    placeholder: "gsk_...",
    infoUrl: "https://console.groq.com/keys",
    infoText: "Get a free key from Groq Console"
  },
  ollama: {
    id: "ollama",
    name: "Ollama (local)",
    free: !0,
    noKey: !0,
    defaultModel: "llama3.2",
    placeholder: "http://localhost:11434",
    infoUrl: "https://ollama.ai",
    infoText: "Install Ollama on your machine"
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    free: !1,
    defaultModel: "claude-haiku-4-5-20251001",
    placeholder: "sk-ant-...",
    infoUrl: "https://console.anthropic.com/settings/keys",
    infoText: "Get a key from the Anthropic Console"
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    free: !1,
    defaultModel: "gpt-4o-mini",
    placeholder: "sk-...",
    infoUrl: "https://platform.openai.com/api-keys",
    infoText: "Get a key from the OpenAI Platform"
  }
};
function u(e) {
  return Object.hasOwn(s, e);
}
const g = {
  gemini: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "openai/gpt-oss-120b"],
  ollama: ["llama3.2", "llama3.1", "mistral", "qwen2.5"],
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-5", "claude-opus-4-8"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"]
};
function y(e) {
  const o = g[e], a = s[e].defaultModel;
  return o.includes(a) ? o : [a, ...o];
}
const m = {
  config: "aiConfig"
}, n = "http://localhost:11434";
function p(e) {
  if (typeof localStorage < "u")
    return localStorage;
  throw new Error("No storage available: pass a ConfigStorage explicitly outside a browser.");
}
function h(e) {
  if (typeof e != "object" || e === null)
    return null;
  const { provider: o, model: a, apiKeys: i } = e;
  if (typeof o != "string" || !u(o))
    return null;
  const l = Array.isArray(i) ? i.filter((t) => typeof t == "string" && t.trim().length > 0).map((t) => t.trim()) : [], r = typeof a == "string" && a.trim() ? a.trim() : s[o].defaultModel;
  return { provider: o, model: r, apiKeys: l };
}
function v(e, o = m) {
  const i = p().getItem(o.config);
  if (!i)
    return { providers: [], ollamaUrl: n };
  let l;
  try {
    l = JSON.parse(i);
  } catch {
    return { providers: [], ollamaUrl: n };
  }
  if (typeof l != "object" || l === null)
    return { providers: [], ollamaUrl: n };
  const { providers: r, ollamaUrl: t } = l, f = Array.isArray(r) ? r.map(h).filter((c) => c !== null) : [], d = typeof t == "string" && t.trim() ? t.trim() : n;
  return { providers: f, ollamaUrl: d };
}
function O(e, o, a = m) {
  const i = p(), l = {
    providers: e.providers.map((r) => ({
      provider: r.provider,
      model: r.model.trim(),
      apiKeys: r.apiKeys.map((t) => t.trim()).filter((t) => t.length > 0)
    })),
    ollamaUrl: e.ollamaUrl.trim() || n
  };
  i.setItem(a.config, JSON.stringify(l));
}
function U(e) {
  return e.providers.some((o) => o.provider === "ollama" || o.apiKeys.length > 0);
}
export {
  s as P,
  U as i,
  v as l,
  y as m,
  p as r,
  O as s
};
