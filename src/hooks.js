import { ERR } from "./err.js";

/**
 * Inicializa el sistema de hooks en el prototipo de Whanda.
 *
 * Los hooks permiten interceptar y modificar el comportamiento de
 * Whanda en puntos clave del flujo (carrito, checkout, WhatsApp, etc.).
 * Soportan async/await y pueden abortar la ejecución.
 *
 * Hooks disponibles:
 * - beforeAddToCart, afterAddToCart
 * - onCartEmpty, onRemoveItem, afterCartChange
 * - beforeCheckout, afterCheckout
 * - beforeGenerateWhatsApp, afterGenerateWhatsApp
 * - beforeWhatsAppSend
 * - beforeSync, afterSync
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initHooks(Whanda) {
  /**
   * Registra un callback para un hook.
   *
   * @param {string} hook - Nombre del hook
   * @param {Function} fn - Callback async/sync. Recibe payload, retorna payload modificado.
   * @returns {void}
   */
  Whanda.prototype.on = function (hook, fn) {
    if (!this.hooks[hook]) {
      console.warn(`Whanda: unknown hook "${hook}"`);
      return;
    }
    this.hooks[hook].push(fn);
  };

  /**
   * Remueve un callback registrado en un hook.
   *
   * @param {string} hook - Nombre del hook
   * @param {Function} fn - Callback a remover
   */
  Whanda.prototype.off = function (hook, fn) {
    if (!this.hooks[hook]) return;
    this.hooks[hook] = this.hooks[hook].filter((f) => f !== fn);
  };

  /**
   * Ejecuta todos los callbacks de un hook en orden.
   *
   * Cada callback recibe el payload del anterior y puede:
   * - Retornar un nuevo payload (reemplaza el actual)
   * - Retornar { abort: true, message: "..." } para detener la ejecución
   * - No retornar nada (mantiene el payload actual)
   *
   * @param {string} hook - Nombre del hook
   * @param {*} payload - Datos iniciales
   * @returns {Promise<*>} Payload final después de todos los callbacks
   * @throws {Error} W039 si un hook aborta la ejecución
   */
  Whanda.prototype.runHooks = async function (hook, payload) {
    if (!this.hooks[hook]) return payload;
    let result = payload;
    for (const fn of this.hooks[hook]) {
      try {
        const res = await fn(result);
        if (res !== undefined && res !== null) result = res;
        if (res && typeof res === "object" && res.abort === true) {
          const err = new Error(res.message || `${ERR.W039}: "${hook}"`);
          err._whandaAborted = true;
          throw err;
        }
      } catch (err) {
        if (err._whandaAborted) throw err;
        console.error(`Whanda: hook "${hook}" error:`, err);
      }
    }
    return result;
  };
}
