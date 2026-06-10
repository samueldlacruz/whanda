import { ERR } from "./err.js";

/**
 * Inicializa los métodos de gestión de cupones en el prototipo de Whanda.
 *
 * Soporta cupones con monto fijo o porcentaje, expiración, límite de usos
 * y monto mínimo de orden.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initCoupons(Whanda) {
  /**
   * Registra un cupón en el sistema.
   *
   * @param {Object} coupon
   * @param {string} coupon.code - Código del cupón (requerido)
   * @param {number} coupon.amount - Monto del descuento (requerido, positivo)
   * @param {string} [coupon.type="fixed"] - "fixed" o "percent"
   * @param {Date|string} [coupon.expiresAt] - Fecha de expiración
   * @param {number} [coupon.maxUses] - Máximo de usos totales
   * @param {number} [coupon.minOrder] - Monto mínimo de orden
   * @param {number} [coupon.maxDiscount] - Tope de descuento (para porcentajes)
   * @throws {Error} W033 si code no es string válido
   * @throws {Error} W034 si amount no es número positivo
   */
  Whanda.prototype.addCoupon = function (coupon) {
    if (!coupon || typeof coupon.code !== "string" || coupon.code.trim() === "") {
      throw new Error(ERR.W033);
    }
    if (coupon.amount == null || typeof coupon.amount !== "number" || coupon.amount <= 0) {
      throw new Error(ERR.W034);
    }
    this.state.coupons.push(coupon);
  };

  /**
   * Retorna una copia de todos los cupones registrados.
   * @returns {Array<Object>}
   */
  Whanda.prototype.getCoupons = function () {
    return [...this.state.coupons];
  };

  /**
   * Verifica si un código de cupón existe en el sistema.
   * @param {string} code
   * @returns {boolean}
   */
  Whanda.prototype.validateCoupon = function (code) {
    if (typeof code !== "string") return false;
    return this.state.coupons.some((c) => c.code === code);
  };

  /**
   * Aplica un cupón a la orden actual.
   * Valida expiración, límite de usos y monto mínimo de orden.
   *
   * @param {string} code - Código del cupón
   * @returns {Object} Copia del cupón aplicado
   * @throws {Error} W007 si code no es string
   * @throws {Error} W008 si el cupón no existe
   * @throws {Error} W009 si el cupón expiró
   * @throws {Error} W010 si alcanzó el límite de usos
   * @throws {Error} W011 si no cumple el monto mínimo
   */
  Whanda.prototype.applyCoupon = function (code) {
    if (typeof code !== "string") {
      throw new Error(ERR.W007);
    }
    const coupon = this.state.coupons.find((c) => c.code === code);
    if (!coupon) throw new Error(ERR.W008);
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new Error(ERR.W009);
    }
    if (coupon.maxUses != null && (coupon.usedCount || 0) >= coupon.maxUses) {
      throw new Error(ERR.W010);
    }
    if (coupon.minOrder != null && this.getSubtotal() < coupon.minOrder) {
      throw new Error(`${ERR.W011} for this coupon is ${coupon.minOrder}`);
    }
    this.state.coupon = coupon;
    return { ...coupon };
  };

  /**
   * Remueve el cupón activo de la orden.
   */
  Whanda.prototype.removeCoupon = function () {
    this.state.coupon = null;
  };

  /**
   * Retorna el cupón activo actual o null.
   * @returns {Object|null}
   */
  Whanda.prototype.getActiveCoupon = function () {
    return this.state.coupon ? { ...this.state.coupon } : null;
  };
}
