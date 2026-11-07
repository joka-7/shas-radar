import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Library mode, not an app build: there's no HTML entry here, just a script
// that self-mounts into static/index.html's #ai-model-picker-root. Fixed
// output filenames (no content hash) so index.html can reference them
// directly, and the whole point of building at all is that this output gets
// committed -- `pip install && uvicorn --reload` still needs no Node.
export default defineConfig({
  plugins: [react()],
  // Library mode doesn't statically replace `process.env.NODE_ENV` in
  // bundled node_modules code the way an app build does -- without this,
  // React's own CJS entry point runtime-checks it to pick production vs.
  // development, throws `ReferenceError: process is not defined` in the
  // browser (there's no `process` global there), and Rollup can't
  // tree-shake away the unreachable branch either, bundling both builds.
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "../static/vendor/model-picker",
    emptyOutDir: true,
    cssCodeSplit: false,
    // Library mode leaves output unminified by default (it assumes a
    // downstream bundler will do that) -- this output *is* the downstream
    // end, served straight to the browser, so it needs minifying itself.
    minify: "esbuild",
    cssMinify: "esbuild",
    // Two entries: the picker (main.js, loaded when the settings dialog
    // opens) and browser-ai.js (no React; loaded by app.js when an analysis
    // runs on the visitor's own key -- see src/browserAi.ts). What they share
    // goes into fixed-name chunks so the committed output stays stable.
    lib: {
      entry: { main: "src/main.tsx", "browser-ai": "src/browserAi.ts" },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: {
        assetFileNames: "main.[ext]",
        chunkFileNames: "chunk-[name].js",
      },
    },
  },
});
