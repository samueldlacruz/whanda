import { initExtensions } from "./whanda-extensions.js";

// For IIFE build: extend existing globalThis.Whanda
if (typeof globalThis !== "undefined" && globalThis.Whanda) {
  initExtensions(globalThis.Whanda);
}

export default initExtensions;
