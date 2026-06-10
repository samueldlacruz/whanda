/**
 * Inicializa el método de sincronización en el prototipo de Whanda.
 *
 * El hook sync permite integrar con backend, localStorage, IndexedDB,
 * o cualquier sistema externo para persistir el estado.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initSync(Whanda) {
  /**
   * Sincroniza datos con un sistema externo a través de hooks.
   *
   * Ejecuta beforeSync → el consumidor persiste → afterSync.
   * El resultado del hook beforeSync se retorna como payload.
   *
   * @param {Object} data - Datos a sincronizar
   * @returns {Promise<Object>} Payload resultante de los hooks
   */
  Whanda.prototype.sync = async function (data) {
    let payload = await this.runHooks("beforeSync", data);
    const result = payload;
    await this.runHooks("afterSync", result);
    return result;
  };
}
