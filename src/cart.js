import { ERR } from "./err.js";

/**
 * Inicializa los métodos de carrito de compras en el prototipo de Whanda.
 *
 * Soporta agregar, actualizar, eliminar y consultar ítems.
 * Cada operación dispara hooks correspondientes.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initCart(Whanda) {
  /**
   * Retorna una copia del carrito actual.
   * @returns {Array<Object>} Copia del arreglo de ítems
   */
  Whanda.prototype.getCart = function () {
    return [...this.state.cart];
  };

  /**
   * Agrega un producto al carrito. Si ya existe, incrementa la cantidad.
   * Dispara hooks: beforeAddToCart, afterAddToCart, afterCartChange.
   *
   * @param {string|number} productId - ID del producto
   * @param {number} [quantity=1] - Cantidad a agregar (entero positivo)
   * @returns {Promise<void>}
   * @throws {Error} W002 si el producto no existe
   * @throws {Error} W003 si quantity no es entero positivo
   * @throws {Error} W004 si stock insuficiente
   */
  Whanda.prototype.addItem = async function (productId, quantity = 1) {
    if (typeof productId !== "string" && typeof productId !== "number") {
      throw new Error(ERR.W002);
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(ERR.W003);
    }
    await this.runHooks("beforeAddToCart", { productId, quantity });
    const product = this.getProduct(productId);
    if (!product) throw new Error(ERR.W002);
    if (product.stock != null && product.stock < quantity) {
      throw new Error(this._stockError(product.name, product.stock));
    }
    const existing = this._findCartItem(productId);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock != null && product.stock < newQty) {
        throw new Error(
          this._stockError(product.name, product.stock) + `, en carrito: ${existing.quantity}`
        );
      }
      existing.quantity = newQty;
    } else {
      this.state.cart.push({
        productId,
        quantity,
        price: product.price,
        name: this._sanitizeString(product.name),
      });
    }
    await this.runHooks("afterAddToCart", this.state.cart);
    await this.runHooks("afterCartChange", this.state.cart);
  };

  /**
   * Vacía el carrito completamente.
   * Dispara hooks: onCartEmpty, afterCartChange (fire-and-forget).
   */
  Whanda.prototype.clearCart = function () {
    this.runHooks("onCartEmpty", { cart: [...this.state.cart] }).catch(() => {});
    this.state.cart = [];
    this.runHooks("afterCartChange", this.state.cart).catch(() => {});
  };

  /**
   * Elimina un producto del carrito por su ID.
   * Dispara hooks: onRemoveItem, afterCartChange (fire-and-forget).
   *
   * @param {string|number} productId
   */
  Whanda.prototype.removeCartItem = function (productId) {
    this.runHooks("onRemoveItem", { productId, cart: [...this.state.cart] }).catch(() => {});
    this.state.cart = this.state.cart.filter(
      (item) => item.productId !== productId
    );
    this.runHooks("afterCartChange", this.state.cart).catch(() => {});
  };

  /**
   * Actualiza la cantidad de un producto en el carrito.
   * Si quantity es 0, elimina el ítem.
   *
   * @param {string|number} productId
   * @param {number} quantity - Nueva cantidad (entero no negativo)
   * @throws {Error} W005 si quantity no es entero no negativo
   * @throws {Error} W006 si el producto no está en el carrito
   * @throws {Error} W004 si stock insuficiente
   */
  Whanda.prototype.updateQuantity = function (productId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error(ERR.W005);
    }
    const item = this._findCartItem(productId);
    if (!item) throw new Error(ERR.W006);
    if (quantity === 0) {
      this.removeCartItem(productId);
    } else {
      const product = this.getProduct(productId);
      if (product && product.stock != null && product.stock < quantity) {
        throw new Error(this._stockError(product.name, product.stock));
      }
      item.quantity = quantity;
      this.runHooks("afterCartChange", this.state.cart).catch(() => {});
    }
  };

  /**
   * Verifica si un producto está en el carrito.
   * @param {string|number} productId
   * @returns {boolean}
   */
  Whanda.prototype.hasCartItem = function (productId) {
    return this._hasCartItem(productId);
  };

  /**
   * Retorna el total de unidades en el carrito (suma de cantidades).
   * @returns {number}
   */
  Whanda.prototype.getCartItemCount = function () {
    return this.state.cart.reduce((count, item) => count + item.quantity, 0);
  };
}
