import { build } from "esbuild";
import { mkdirSync } from "fs";

mkdirSync("dist", { recursive: true });

// IIFE para browser (window.Whanda)
// Core solo — sin plugins ni extensions
await build({
  entryPoints: ["src/whanda-only.js"],
  bundle: true,
  format: "iife",
  outfile: "dist/whanda.min.js",
  minify: true,
  banner: {
    js: "/* Whanda v2.0.0 | Headless Catalog + WhatsApp Checkout */",
  },
});

console.log("✓ dist/whanda.min.js (IIFE)");

// IIFE plugins — incluye whanda-core + plugins
await build({
  entryPoints: ["src/plugins-only.js"],
  bundle: true,
  format: "iife",
  outfile: "dist/whanda-plugins.min.js",
  minify: true,
  banner: {
    js: "/* Whanda Plugins v2.0.0 | Optional Features */",
  },
});

console.log("✓ dist/whanda-plugins.min.js (IIFE)");

// IIFE extensions — incluye whanda-core + extensions
await build({
  entryPoints: ["src/extensions-only.js"],
  bundle: true,
  format: "iife",
  outfile: "dist/whanda-extensions.min.js",
  minify: true,
  banner: {
    js: "/* Whanda Extensions v2.0.0 | Optional Methods */",
  },
});

console.log("✓ dist/whanda-extensions.min.js (IIFE)");

// ES Module minificado — incluye todo (core + plugins + extensions)
await build({
  entryPoints: ["src/index.js"],
  bundle: true,
  format: "esm",
  outfile: "dist/whanda.esm.min.js",
  minify: true,
});

console.log("✓ dist/whanda.esm.min.js (ESM)");
console.log("Build completo.");
