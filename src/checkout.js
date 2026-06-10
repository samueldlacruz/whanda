import { ERR } from "./err.js";

/**
 * Inicializa los métodos de checkout y creación de órdenes en el prototipo de Whanda.
 *
 * Maneja validación de checkout, métodos de pago/entrega, previsualización
 * y creación de órdenes con cálculo de precios.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initCheckout(Whanda) {
  /**
   * Retorna los métodos de pago configurados.
   * @returns {string[]}
   */
  Whanda.prototype.getPaymentMethods = function () {
    return [...this.config.paymentMethods];
  };

  /**
   * Establece el método de pago para la orden actual.
   *
   * @param {string} method - Debe estar en config.paymentMethods
   * @throws {Error} W016 si el método no es válido
   */
  Whanda.prototype.setPaymentMethod = function (method) {
    if (!this.getPaymentMethods().includes(method)) {
      throw new Error(ERR.W016);
    }
    this.state.checkout.paymentMethod = method;
  };

  /**
   * Retorna los métodos de entrega configurados.
   * @returns {string[]}
   */
  Whanda.prototype.getDeliveryMethods = function () {
    return [...this.config.deliveryMethods];
  };

  /**
   * Establece el método de entrega para la orden actual.
   *
   * @param {string} method - Debe estar en config.deliveryMethods
   * @throws {Error} W017 si el método no es válido
   */
  Whanda.prototype.setDeliveryMethod = function (method) {
    if (!this.getDeliveryMethods().includes(method)) {
      throw new Error(ERR.W017);
    }
    this.state.checkout.deliveryMethod = method;
  };

  /**
   * Valida que la orden esté lista para ser creada.
   * Verifica: carrito no vacío, nombre, dirección, pago y entrega.
   *
   * @returns {true} Si todo está válido
   * @throws {Error} W018–W022 si falta algún campo requerido
   */
  Whanda.prototype.validateCheckout = function () {
    if (this.state.cart.length === 0) throw new Error(ERR.W018);
    if (!this.state.customer.name) throw new Error(ERR.W019);
    if (!this.state.customer.address) throw new Error(ERR.W020);
    if (!this.state.checkout.paymentMethod) throw new Error(ERR.W021);
    if (!this.state.checkout.deliveryMethod) throw new Error(ERR.W022);
    return true;
  };

  /**
   * Retorna un preview de la orden sin crearla.
   *
   * @returns {Object} Datos de la orden con items, customer, pricing
   */
  Whanda.prototype.preview = function () {
    const pricing = this.calculate();
    return {
      items: this.getCart(),
      customer: this.getCustomer(),
      paymentMethod: this.state.checkout.paymentMethod,
      deliveryMethod: this.state.checkout.deliveryMethod,
      ...pricing,
    };
  };

  /**
   * Crea una orden, la guarda en state.orders y vacía el carrito.
   *
   * Genera un ID único basado en timestamp + random, calcula precios,
   * incrementa el contador de usos del cupón si aplica, y dispara
   * hooks: beforeCheckout, afterCheckout, afterCartChange.
   *
   * @param {Object} [meta={}] - Metadata adicional para la orden
   * @returns {Promise<Object>} Orden creada
   * @throws {Error} W018–W022 si validateCheckout falla
   */
  Whanda.prototype.createOrder = async function (meta = {}) {
    this.validateCheckout();
    await this.runHooks("beforeCheckout", meta);
    const pricing = this.calculate();
    const order = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      items: structuredClone(this.state.cart),
      subtotal: pricing.subtotal,
      shipping: pricing.shipping,
      discount: pricing.discount,
      tax: pricing.tax,
      taxRate: pricing.taxRate,
      taxName: this.getTaxName(),
      total: pricing.total,
      currency: this.state.activeCurrency,
      region: this.state.activeRegion,
      customer: { ...this.state.customer },
      paymentMethod: this.state.checkout.paymentMethod,
      deliveryMethod: this.state.checkout.deliveryMethod,
      status: "pending",
      meta,
      createdAt: new Date().toISOString(),
    };
    if (this.state.coupon) {
      const couponIdx = this.state.coupons.findIndex(
        (c) => c.code === this.state.coupon.code
      );
      if (couponIdx !== -1) {
        this.state.coupons[couponIdx].usedCount =
          (this.state.coupons[couponIdx].usedCount || 0) + 1;
      }
    }
    this.state.orders.push(order);
    this.state.cart = [];
    this.state.coupon = null;
    this.state.checkout = { paymentMethod: null, deliveryMethod: null };
    await this.runHooks("afterCheckout", order);
    await this.runHooks("afterCartChange", this.state.cart);
    return order;
  };
}
