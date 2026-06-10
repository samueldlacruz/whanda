/**
 * Inicializa los métodos de datos del cliente en el prototipo de Whanda.
 *
 * Todos los valores se sanitizan automáticamente contra XSS.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initCustomer(Whanda) {
  /**
   * Establece el nombre del cliente (sanitizado).
   * @param {string} name
   */
  Whanda.prototype.setCustomerName = function (name) {
    this.state.customer.name = this._sanitizeString(name);
  };

  /**
   * Establece la dirección del cliente (sanitizada).
   * @param {string} address
   */
  Whanda.prototype.setCustomerAddress = function (address) {
    this.state.customer.address = this._sanitizeString(address);
  };

  /**
   * Establece notas adicionales del cliente (sanitizadas).
   * @param {string} notes
   */
  Whanda.prototype.setCustomerNotes = function (notes) {
    this.state.customer.notes = this._sanitizeString(notes);
  };

  /**
   * Retorna los datos del cliente actuales.
   * @returns {{ name: string|null, address: string|null, notes: string|null }}
   */
  Whanda.prototype.getCustomer = function () {
    return { ...this.state.customer };
  };
}
