import { Whanda } from "./whanda.js";
import { loadFromSheets } from "./whanda-sheets.js";

// For IIFE build: expose Whanda class and loadFromSheets on globalThis
if (typeof globalThis !== "undefined") {
  globalThis.Whanda = Whanda;
  globalThis.Whanda.loadFromSheets = loadFromSheets;
}

export { loadFromSheets };
export default Whanda;
