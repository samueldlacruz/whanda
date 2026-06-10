import { ERR } from "./err.js";

/**
 * Inicializa los métodos de gestión de órdenes en el prototipo de Whanda.
 *
 * Permite consultar, actualizar estado y cancelar órdenes.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initOrders(Whanda) {
  /**
   * Retorna una orden por su ID o null si no existe.
   *
   * @param {string} id - ID de la orden
   * @returns {Object|null}
   */
  Whanda.prototype.getOrder = function (id) {
    return this.state.orders.find((o) => o.id === id) || null;
  };

  /**
   * Retorna la última orden creada o null.
   * @returns {Object|null}
   */
  Whanda.prototype.getLastOrder = function () {
    return this.state.orders[this.state.orders.length - 1] || null;
  };

  /**
   * Retorna todas las órdenes (copia del arreglo).
   * @returns {Array<Object>}
   */
  Whanda.prototype.listOrders = function () {
    return [...this.state.orders];
  };

  /**
   * Actualiza el estado de una orden.
   *
   * Estados válidos: "pending", "confirmed", "shipped", "delivered", "cancelled"
   *
   * @param {string} id - ID de la orden
   * @param {string} status - Nuevo estado
   * @returns {Object} Orden actualizada
   * @throws {Error} W023 si el estado no es válido
   * @throws {Error} W024 si la orden no existe
   */
  Whanda.prototype.updateOrderStatus = function (id, status) {
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new Error(`${ERR.W023}. Debe ser uno de: ${validStatuses.join(", ")}`);
    }
    const order = this.state.orders.find((o) => o.id === id);
    if (!order) throw new Error(ERR.W024);
    order.status = status;
    return order;
  };

  /**
   * Cancela una orden cambiando su status a "cancelled".
   * La orden permanece en el historial.
   *
   * @param {string} id - ID de la orden
   * @returns {Object} Orden cancelada
   * @throws {Error} W024 si la orden no existe
   */
  Whanda.prototype.cancelOrder = function (id) {
    return this.updateOrderStatus(id, "cancelled");
  };
}
