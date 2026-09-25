# frontend/

The AI settings dialog's provider/model/key picker — the one part of this
app with a build step. Everything else in `static/` is hand-written,
dependency-free JS with nothing to compile; see the root
[`README.md`](../README.md#frontend-build-step-ai-settings-only) for why
this one widget is different and how the two sides of that boundary agree
on a `localStorage` key and a `CustomEvent` instead of importing each other.

```bash
npm ci
npm run build   # writes ../static/vendor/model-picker/ (committed)
```

`npm run typecheck` / `npm run lint` / `npm run format` run the same checks
CI does. There's no `npm run dev` — this isn't a page of its own, just a
script that mounts into `static/index.html`'s `#ai-model-picker-root`, so
iterating means rebuilding and reloading that page.
