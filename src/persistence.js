import { ERR } from "./err.js";

/**
 * Inicializa los métodos de persistencia (guardar/cargar/resetear)
 * en el prototipo de Whanda.
 *
 * Permite serializar el estado a JSON y restaurarlo, con validación
 * de esquema para prevenir inyección de datos maliciosos.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initPersistence(Whanda) {
  /**
   * Serializa el estado completo de Whanda a un string JSON.
   * Incluye config, state y template activo.
   *
   * @returns {string} JSON string del estado
   */
  Whanda.prototype.save = function () {
    return JSON.stringify({
      config: this.config,
      state: this.state,
      templates: {
        active: this.templates.active,
      },
    });
  };

  /**
   * Restaura el estado desde un string JSON.
   * Solo carga campos permitidos (allowlist) para prevenir
   * inyección de propiedades no deseadas.
   *
   * @param {string} jsonString - JSON serializado previamente con save()
   * @throws {Error} W040 si el JSON es inválido
   * @throws {Error} W041 si el JSON no es un objeto
   */
  Whanda.prototype.load = function (jsonString) {
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`${ERR.W040}: ${e.message}`);
    }
    if (data === null || typeof data !== "object") {
      throw new Error(ERR.W041);
    }
    if (data.config) {
      const allowedConfigKeys = [
        "currency", "locale", "whatsappNumber", "shipping",
        "paymentMethods", "deliveryMethods", "storeName",
      ];
      const safeConfig = {};
      for (const key of allowedConfigKeys) {
        if (data.config[key] !== undefined) {
          safeConfig[key] = data.config[key];
        }
      }
      this.config = { ...this.config, ...safeConfig };
    }
    if (data.state) {
      const allowedStateKeys = [
        "cart", "coupons", "coupon", "customer", "checkout",
        "orders", "downsell", "seasons", "urgency", "bundles",
        "cro", "recentlyViewed",
      ];
      const safeState = {};
      for (const key of allowedStateKeys) {
        if (data.state[key] !== undefined) {
          safeState[key] = data.state[key];
        }
      }
      this.state = { ...this.state, ...safeState };
    }
    if (data.templates && data.templates.active) {
      this.templates.active = data.templates.active;
    }
  };

  /**
   * Resetea el carrito, cupón, datos del cliente y checkout.
   * No modifica productos, cupones registrados ni órdenes.
   */
  Whanda.prototype.reset = function () {
    this.state.cart = [];
    this.state.coupon = null;
    this.state.customer = { name: null, address: null, notes: null };
    this.state.checkout = { paymentMethod: null, deliveryMethod: null };
  };
}
