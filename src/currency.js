import { ERR } from "./err.js";

/**
 * Inicializa los métodos de multi-moneda en el prototipo de Whanda.
 *
 * Permite configurar moneda activa, tasas de cambio y formato
 * de precios con soporte internacional (Intl.NumberFormat).
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initCurrency(Whanda) {
  /**
   * Establece la moneda activa para precios y formateo.
   *
   * @param {string} currencyCode - Código ISO de la moneda (ej: "USD", "DOP", "EUR")
   * @throws {Error} W037 si la moneda no está en config.currencies
   */
  Whanda.prototype.setCurrency = function (currencyCode) {
    const supported = Object.keys(this.config.currencies);
    if (supported.length > 0 && !supported.includes(currencyCode)) {
      throw new Error(`${ERR.W037}: "${currencyCode}". Soportadas: ${supported.join(", ")}`);
    }
    this.state.activeCurrency = currencyCode;
  };

  /**
   * Retorna el código de moneda activo.
   * @returns {string}
   */
  Whanda.prototype.getCurrency = function () {
    return this.state.activeCurrency;
  };

  /**
   * Retorna la tasa de cambio de una moneda respecto a la base.
   *
   * @param {string} currencyCode
   * @returns {number} Tasa de cambio (1 si no está configurada)
   */
  Whanda.prototype.getExchangeRate = function (currencyCode) {
    if (!this.config.currencies[currencyCode]) return 1;
    return this.config.currencies[currencyCode];
  };

  /**
   * Convierte un precio base al valor en la moneda activa.
   *
   * @param {number} basePrice - Precio en moneda base
   * @returns {number} Precio convertido (redondeado a 2 decimales)
   */
  Whanda.prototype.convertPrice = function (basePrice) {
    if (typeof basePrice !== "number" || !Number.isFinite(basePrice)) return 0;
    const rate = this.getExchangeRate(this.state.activeCurrency);
    return Math.round(basePrice * rate * 100) / 100;
  };

  /**
   * Formatea un monto como precio con moneda usando Intl.NumberFormat.
   *
   * @param {number} amount - Monto a formatear
   * @param {string} [currencyCode] - Moneda (default: activa)
   * @returns {string} Precio formateado (ej: "$1,200.00")
   */
  Whanda.prototype.formatPrice = function (amount, currencyCode) {
    const code = currencyCode || this.state.activeCurrency;
    try {
      return new Intl.NumberFormat(this.config.locale, {
        style: "currency",
        currency: code,
      }).format(amount);
    } catch {
      return `${code} ${amount.toFixed(2)}`;
    }
  };
}
