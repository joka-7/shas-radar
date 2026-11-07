var A = Object.defineProperty;
var E = (t, e, o) => e in t ? A(t, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[e] = o;
var m = (t, e, o) => E(t, typeof e != "symbol" ? e + "" : e, o);
import { i as O, l as v } from "./chunk-config.js";
const h = 6e4, y = 600;
function _(t, e = h) {
  const o = AbortSignal.timeout(e);
  return t ? AbortSignal.any([t, o]) : o;
}
function S(t) {
  return t === 429 || t >= 500 && t < 600;
}
async function u(t, e, o, n = h) {
  for (let r = 0; ; r++)
    try {
      const a = await fetch(t, { ...e, signal: _(o, n) });
      if (r === 0 && S(a.status)) {
        await new Promise((s) => setTimeout(s, y));
        continue;
      }
      return a;
    } catch (a) {
      if (o != null && o.aborted || r > 0)
        throw a;
      await new Promise((s) => setTimeout(s, y));
    }
}
function b(t) {
  let e;
  try {
    e = new URL(t);
  } catch (n) {
    throw new Error(`Invalid Ollama URL: ${n.message}`, { cause: n });
  }
  if (!["localhost", "127.0.0.1", "::1"].includes(e.hostname) && e.protocol !== "https:")
    throw new Error("Remote Ollama must use HTTPS. For local testing, use http://localhost:11434");
  return e.origin;
}
async function d(t) {
  var n;
  const e = await t.json().catch(() => ({}));
  return ((n = e == null ? void 0 : e.error) == null ? void 0 : n.message) ?? `HTTP ${t.status}`;
}
const U = 1024, j = "https://api.anthropic.com/v1/messages";
function x(t) {
  return t.filter((e) => e.role !== "system").map((e) => ({ role: e.role, content: e.content }));
}
function $(t, e) {
  var o;
  return e ?? ((o = t.find((n) => n.role === "system")) == null ? void 0 : o.content);
}
function k(t, e, o, n) {
  const r = $(e, o.systemInstruction);
  return {
    model: t.model,
    max_tokens: o.maxTokens ?? U,
    ...r ? { system: r } : {},
    messages: x(e)
  };
}
function C(t) {
  return {
    "Content-Type": "application/json",
    "x-api-key": t.apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true"
  };
}
async function I(t, e, o = {}) {
  var a, s;
  const n = await u(j, { method: "POST", headers: C(t), body: JSON.stringify(k(t, e, o)) }, o.signal);
  if (!n.ok)
    throw new Error(await d(n));
  return ((s = (a = (await n.json()).content) == null ? void 0 : a[0]) == null ? void 0 : s.text) ?? "";
}
const K = 1024;
function P(t) {
  return t.filter((e) => e.role !== "system").map((e) => ({ role: e.role === "assistant" ? "model" : "user", parts: [{ text: e.content }] }));
}
function N(t, e) {
  var o;
  return e ?? ((o = t.find((n) => n.role === "system")) == null ? void 0 : o.content);
}
function M(t, e) {
  const o = N(t, e.systemInstruction);
  return {
    contents: P(t),
    generationConfig: {
      maxOutputTokens: e.maxTokens ?? K,
      ...e.jsonMode ? { responseMimeType: "application/json" } : {}
    },
    ...o ? { systemInstruction: { parts: [{ text: o }] } } : {}
  };
}
async function L(t, e, o = {}) {
  var s, i, c, p, f;
  const n = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(t.model)}:generateContent`, r = await u(n, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": t.apiKey },
    body: JSON.stringify(M(e, o))
  }, o.signal);
  if (!r.ok)
    throw new Error(await d(r));
  return ((f = (p = (c = (i = (s = (await r.json()).candidates) == null ? void 0 : s[0]) == null ? void 0 : i.content) == null ? void 0 : c.parts) == null ? void 0 : p[0]) == null ? void 0 : f.text) ?? "";
}
const R = 1024;
function B(t, e) {
  return [...!t.some((r) => r.role === "system") && e ? [{ role: "system", content: e }] : [], ...t.map((r) => ({ role: r.role, content: r.content }))];
}
function F(t, e, o, n) {
  return {
    model: t.model,
    messages: B(e, o.systemInstruction),
    stream: n,
    options: { num_predict: o.maxTokens ?? R }
  };
}
async function D(t, e, o = {}) {
  var s;
  const n = b(t.ollamaUrl), r = await u(`${n}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(F(t, e, o, !1))
  }, o.signal);
  if (!r.ok)
    throw new Error(`Ollama error: HTTP ${r.status}. Is Ollama running?`);
  return ((s = (await r.json()).message) == null ? void 0 : s.content) ?? "";
}
const q = 1024, H = {
  openai: "https://api.openai.com/v1/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions"
};
function X(t, e) {
  return [...!t.some((r) => r.role === "system") && e ? [{ role: "system", content: e }] : [], ...t.map((r) => ({ role: r.role, content: r.content }))];
}
function J(t, e, o, n) {
  return {
    model: t.model,
    max_tokens: o.maxTokens ?? q,
    messages: X(e, o.systemInstruction),
    ...o.jsonMode ? { response_format: { type: "json_object" } } : {}
  };
}
async function Y(t, e, o, n, r) {
  const a = await u(H[t], {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${e.apiKey}` },
    body: JSON.stringify(J(e, o, n))
  }, n.signal);
  if (!a.ok)
    throw new Error(await d(a));
  return a;
}
async function G(t, e, o, n = {}) {
  var s, i, c;
  return ((c = (i = (s = (await (await Y(t, e, o, n)).json()).choices) == null ? void 0 : s[0]) == null ? void 0 : i.message) == null ? void 0 : c.content) ?? "";
}
class w extends Error {
  constructor() {
    super("No AI provider is configured — add a provider and key (or Ollama) in AI settings."), this.name = "NoProviderConfiguredError";
  }
}
class g extends Error {
  constructor(o) {
    super(`All configured AI providers failed: ${o.map((n) => `${n.provider} (${n.error})`).join("; ")}`);
    m(this, "attempts");
    this.name = "AllProvidersExhaustedError", this.attempts = o;
  }
}
function z(t) {
  const e = [];
  for (const o of t.providers) {
    if (o.provider === "ollama") {
      e.push({ provider: "ollama", model: o.model, apiKey: "", ollamaUrl: t.ollamaUrl });
      continue;
    }
    for (const n of o.apiKeys)
      n && e.push({ provider: o.provider, model: o.model, apiKey: n, ollamaUrl: t.ollamaUrl });
  }
  return e;
}
function W(t) {
  return typeof t == "string" ? [{ role: "user", content: t }] : t;
}
function Q(t, e, o) {
  switch (t.provider) {
    case "gemini":
      return L(t, e, o);
    case "anthropic":
      return I(t, e, o);
    case "ollama":
      return D(t, e, o);
    case "openai":
    case "groq":
      return G(t.provider, t, e, o);
  }
}
async function V(t, e, o = {}) {
  const n = z(t);
  if (n.length === 0)
    throw new w();
  const r = W(e), a = [];
  for (const s of n)
    try {
      return await Q(s, r, o);
    } catch (i) {
      a.push({ provider: s.provider, error: i.message });
    }
  throw new g(a);
}
const Z = { config: "shas-radar:ai-config" }, tt = 500;
class l extends Error {
  constructor(o, n) {
    super(n);
    m(this, "code");
    this.name = "BrowserAiError", this.code = o;
  }
}
function et(t) {
  if (typeof t != "object" || t === null) return !1;
  const { role: e, content: o } = t;
  return (e === "user" || e === "assistant") && typeof o == "string";
}
function ot(t) {
  if (typeof t == "object" && t !== null) {
    const { system: e, messages: o } = t;
    if (typeof e == "string" && Array.isArray(o) && o.every(et))
      return { system: e, messages: o };
  }
  throw new l("invalid_prompt", "The server returned an unexpected analysis prompt.");
}
function nt(t) {
  return t instanceof l ? t : t instanceof w ? new l("no_credential", t.message) : t instanceof g ? new l("all_providers_exhausted", t.message) : new l("provider_error", t instanceof Error ? t.message : String(t));
}
function rt(t) {
  return {
    hasOwnKey: () => O(t()),
    async complete(e) {
      try {
        const { system: o, messages: n } = ot(e);
        return await V(t(), n, {
          systemInstruction: o,
          maxTokens: tt
        });
      } catch (o) {
        throw nt(o);
      }
    }
  };
}
const T = rt(() => v(void 0, Z));
function it() {
  return T.hasOwnKey();
}
function ct(t) {
  return T.complete(t);
}
export {
  l as BrowserAiError,
  ct as completeAnalysis,
  rt as createBrowserAi,
  it as hasOwnKey
};
