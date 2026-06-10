import { ERR } from "./err.js";

/**
 * Inicializa los métodos de multi-región en el prototipo de Whanda.
 *
 * Cada región puede tener su propia moneda, impuestos y configuración
 * de envío. Al cambiar de región se actualiza automáticamente la moneda.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initRegion(Whanda) {
  /**
   * Establece la región activa. Cambia la moneda automáticamente
   * si la región tiene una moneda configurada.
   *
   * @param {string} regionCode - Código de la región (ej: "DO", "US", "MX")
   * @throws {Error} W038 si la región no está en config.regions
   */
  Whanda.prototype.setRegion = function (regionCode) {
    const supported = Object.keys(this.config.regions);
    if (supported.length > 0 && !supported.includes(regionCode)) {
      throw new Error(`${ERR.W038}: "${regionCode}". Soportadas: ${supported.join(", ")}`);
    }
    this.state.activeRegion = regionCode;
    const region = this.config.regions[regionCode];
    if (region && region.currency) {
      this.state.activeCurrency = region.currency;
    }
  };

  /**
   * Retorna el código de región activo.
   * @returns {string}
   */
  Whanda.prototype.getRegion = function () {
    return this.state.activeRegion;
  };

  /**
   * Retorna la tasa de impuesto de la región activa.
   *
   * Soporta tanto number (ej: 0.18) como object ({ rate: 0.18, name: "ITBIS" }).
   *
   * @returns {number} Tasa de impuesto (0 si no hay región o impuesto)
   */
  Whanda.prototype.getTax = function () {
    const region = this.config.regions[this.state.activeRegion];
    if (!region || !region.tax) return 0;
    if (typeof region.tax === "number") return region.tax;
    if (typeof region.tax === "object" && region.tax.rate !== undefined) {
      return region.tax.rate;
    }
    return 0;
  };

  /**
   * Retorna el nombre del impuesto de la región activa.
   *
   * @returns {string} Nombre del impuesto ("Tax" si no está configurado)
   */
  Whanda.prototype.getTaxName = function () {
    const region = this.config.regions[this.state.activeRegion];
    if (!region || !region.tax) return "Tax";
    if (typeof region.tax === "object" && region.tax.name) {
      return region.tax.name;
    }
    return "Tax";
  };

  /**
   * Calcula el costo de envío según la configuración regional.
   * Si la región no tiene configuración de envío, usa el global.
   *
   * @param {number} [subtotal] - Subtotal para verificar envío gratis
   * @returns {number} Costo de envío
   */
  Whanda.prototype.getRegionalShippingCost = function (subtotal) {
    const region = this.config.regions[this.state.activeRegion];
    if (!region || !region.shipping) {
      return this.config.shipping.value || 0;
    }
    const sub = subtotal !== undefined ? subtotal : this.getSubtotal();
    const shipping = region.shipping;
    if (shipping.freeFrom && sub >= shipping.freeFrom) return 0;
    if (shipping.flat !== undefined) return shipping.flat;
    if (shipping.type === "per_item") {
      const itemCount = this.getCartItemCount();
      return itemCount * (shipping.perItem || 0);
    }
    return 0;
  };
}
