import { Whanda } from "./whanda.js";

// For IIFE build: expose Whanda class directly on globalThis
if (typeof globalThis !== "undefined") {
  globalThis.Whanda = Whanda;
}

export default Whanda;
