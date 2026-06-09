// ================================
// WHANDA EXTENSIONS
// Optional methods rarely needed
// ================================

/**
 * Initializes Whanda extensions by adding methods to the prototype.
 * @param {Function} Whanda - The Whanda class
 */
export function initExtensions(Whanda) {
  /**
   * Exports all orders as a CSV string.
   * Properly escapes commas, quotes, and newlines in values.
   *
   * @returns {string} CSV string with headers: ID,Fecha,Cliente,Total,Pago,Entrega,Status
   */
  Whanda.prototype.exportOrders = function () {
    if (this.state.orders.length === 0) return "";
    const escape = (val) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const headers = ["ID,Fecha,Cliente,Total,Pago,Entrega,Status"];
    const rows = this.state.orders.map(
      (o) =>
        `${o.id},${o.createdAt},${escape(o.customer.name)},${o.total},${escape(o.paymentMethod)},${escape(o.deliveryMethod)},${o.status}`
    );
    return headers.concat(rows).join("\n");
  };
}

export default initExtensions;
