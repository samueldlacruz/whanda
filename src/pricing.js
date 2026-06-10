/**
 * Inicializa los métodos de cálculo de precios en el prototipo de Whanda.
 *
 * Calcula subtotal, envío, descuentos, impuestos y total de la orden.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initPricing(Whanda) {
  /**
   * Calcula el subtotal del carrito (suma de precio × cantidad de cada ítem).
   * @returns {number} Subtotal
   */
  Whanda.prototype.getSubtotal = function () {
    return this.state.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  /**
   * Calcula el costo de envío según el método configurado.
   * Respeta el umbral de envío gratis (freeFrom).
   *
   * @returns {number} Costo de envío (0 si aplica envío gratis)
   */
  Whanda.prototype.getShippingCost = function () {
    const subtotal = this.getSubtotal();
    const freeFrom = this._freeShippingGoal();
    if (freeFrom > 0 && subtotal >= freeFrom) {
      return 0;
    }
    if (this.config.shipping.type === "fixed") {
      return this.config.shipping.value;
    }
    if (this.config.shipping.type === "per_item") {
      const totalItems = this.getCartItemCount();
      return this.config.shipping.perItem * totalItems;
    }
    return 0;
  };

  /**
   * Calcula el monto de descuento del cupón activo.
   * Soporta descuento fijo o porcentaje con tope opcional (maxDiscount).
   *
   * @returns {number} Monto de descuento (0 si no hay cupón)
   */
  Whanda.prototype.getDiscountAmount = function () {
    if (!this.state.coupon) return 0;
    const coupon = this.state.coupon;
    const subtotal = this.getSubtotal();
    if (coupon.type === "percent") {
      const amount = subtotal * (coupon.amount / 100);
      return coupon.maxDiscount != null ? Math.min(amount, coupon.maxDiscount) : amount;
    }
    return coupon.amount || 0;
  };

  /**
   * Calcula el total de la orden: subtotal − descuento + envío + impuestos.
   * El resultado nunca es menor a 0.
   *
   * @returns {number} Total
   */
  Whanda.prototype.getTotal = function () {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingCost();
    const taxRate = this.getTax();
    const taxAmount = Math.round((subtotal - discount) * taxRate * 100) / 100;
    const total = subtotal - discount + shipping + taxAmount;
    return Math.max(0, total);
  };

  /**
   * Retorna un desglose completo de precios para la orden actual.
   *
   * @returns {{ subtotal: number, shipping: number, discount: number, tax: number, taxRate: number, total: number }}
   */
  Whanda.prototype.calculate = function () {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const taxRate = this.getTax();
    const taxAmount = Math.round((subtotal - discount) * taxRate * 100) / 100;
    return {
      subtotal,
      shipping: this.getShippingCost(),
      discount,
      tax: taxAmount,
      taxRate,
      total: this.getTotal(),
    };
  };
}
