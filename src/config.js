import { deepMerge } from "./helpers.js";

/**
 * Inicializa los métodos de configuración en el prototipo de Whanda.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initConfig(Whanda) {
  /**
   * Retorna una copia de la configuración actual.
   *
   * @returns {Object} Copia del objeto config
   */
  Whanda.prototype.getConfig = function () {
    return { ...this.config };
  };

  /**
   * Actualiza parcialmente la configuración.
   * Fusiona profundamente con la existente (deep merge).
   * Los objetos anidados como `shipping` se fusionan en vez de reemplazarse.
   *
   * @param {Object} partialConfig - Campos a actualizar
   */
  Whanda.prototype.updateConfig = function (partialConfig) {
    this.config = deepMerge(this.config, partialConfig);
  };
}
