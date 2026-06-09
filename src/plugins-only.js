import { initPlugins } from "./whanda-plugins.js";

// For IIFE build: extend existing globalThis.Whanda
if (typeof globalThis !== "undefined" && globalThis.Whanda) {
  initPlugins(globalThis.Whanda);
}

export default initPlugins;
