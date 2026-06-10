import { ERR } from "./err.js";

/**
 * Inicializa los métodos de configuración de envío en el prototipo de Whanda.
 *
 * Métodos soportados: fixed (monto fijo), free (gratis), per_item (por ítem).
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initShipping(Whanda) {
  /**
   * Retorna los tipos de envío soportados.
   * @returns {string[]} ["fixed", "free", "per_item"]
   */
  Whanda.prototype.getShippingMethods = function () {
    return ["fixed", "free", "per_item"];
  };

  /**
   * Cambia el tipo de método de envío.
   *
   * @param {string} method - "fixed", "free" o "per_item"
   * @throws {Error} W015 si el método no es válido
   */
  Whanda.prototype.setShippingMethod = function (method) {
    if (!this.getShippingMethods().includes(method)) {
      throw new Error(ERR.W015);
    }
    this.config.shipping.type = method;
  };

  /**
   * Verifica si el envío es gratis para el carrito actual.
   * @returns {boolean}
   */
  Whanda.prototype.isFreeShipping = function () {
    return this.getShippingCost() === 0;
  };

  /**
   * Retorna el umbral mínimo para envío gratis.
   * @returns {number|undefined}
   */
  Whanda.prototype.getFreeShippingMin = function () {
    return this.config.shipping.freeFrom;
  };

  /**
   * Configura envío con monto fijo.
   *
   * @param {number} value - Monto del envío (no negativo)
   * @throws {Error} W012 si value no es número no negativo
   */
  Whanda.prototype.setFixedShipping = function (value) {
    if (typeof value !== "number" || value < 0) {
      throw new Error(ERR.W012);
    }
    this.config.shipping.type = "fixed";
    this.config.shipping.value = value;
  };

  /**
   * Establece el umbral a partir del cual el envío es gratis.
   *
   * @param {number} threshold - Monto mínimo del subtotal
   * @throws {Error} W013 si threshold no es número positivo
   */
  Whanda.prototype.setFreeShippingFrom = function (threshold) {
    this._validatePositiveNumber(threshold, ERR.W013);
    this.config.shipping.freeFrom = threshold;
  };

  /**
   * Configura envío por ítem.
   *
   * @param {number} value - Costo por cada ítem (no negativo)
   * @throws {Error} W014 si value no es número no negativo
   */
  Whanda.prototype.setPerItemShipping = function (value) {
    if (typeof value !== "number" || value < 0) {
      throw new Error(ERR.W014);
    }
    this.config.shipping.type = "per_item";
    this.config.shipping.perItem = value;
  };
}
