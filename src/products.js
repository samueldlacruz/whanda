import { ERR } from "./err.js";

/**
 * Inicializa los métodos de gestión de productos en el prototipo de Whanda.
 *
 * Proporciona CRUD de catálogo, búsqueda, filtrado, ordenamiento,
 * productos relacionados, upsells y cross-sells.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initProducts(Whanda) {
  /**
   * Establece el catálogo completo de productos. Reemplaza los existentes.
   * Los productos se sanitizan automáticamente contra XSS.
   *
   * @param {Array<Object>} products - Arreglo de productos
   * @param {string|number} products[].id - ID único del producto
   * @param {string} products[].name - Nombre del producto
   * @param {number} products[].price - Precio base
   * @param {number} [products[].stock] - Stock disponible (null = ilimitado)
   * @param {string} [products[].category] - Categoría
   * @param {string} [products[].image] - URL de imagen
   * @param {string[]} [products[].images] - URLs de imágenes
   * @param {string[]} [products[].relatedIds] - IDs de productos relacionados
   * @param {string[]} [products[].upsellIds] - IDs de upsells
   * @param {string[]} [products[].crossSellIds] - IDs de cross-sells
   * @throws {Error} W035 si products no es un arreglo
   */
  Whanda.prototype.setProducts = function (products) {
    if (!Array.isArray(products)) {
      throw new Error(ERR.W035);
    }
    this.state.products = this._sanitizeObject(products);
  };

  /**
   * Retorna productos con filtros opcionales.
   *
   * @param {Object} [filter={}]
   * @param {string} [filter.category] - Filtrar por categoría exacta
   * @param {number} [filter.minPrice] - Precio mínimo
   * @param {number} [filter.maxPrice] - Precio máximo
   * @param {string} [filter.search] - Texto de búsqueda (matchea name o category)
   * @param {string} [filter.sort] - Campo para ordenar
   * @param {string} [filter.order] - "asc" (default) o "desc"
   * @param {number} [filter.limit] - Máximo de resultados
   * @returns {Array<Object>} Productos filtrados
   */
  Whanda.prototype.getProducts = function (filter = {}) {
    let result = [...this.state.products];
    if (filter.category) {
      result = result.filter((p) => p.category === filter.category);
    }
    if (filter.minPrice != null) {
      result = result.filter((p) => p.price >= filter.minPrice);
    }
    if (filter.maxPrice != null) {
      result = result.filter((p) => p.price <= filter.maxPrice);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (filter.sort) {
      const dir = filter.order === "desc" ? -1 : 1;
      result.sort((a, b) => {
        if (a[filter.sort] < b[filter.sort]) return -1 * dir;
        if (a[filter.sort] > b[filter.sort]) return 1 * dir;
        return 0;
      });
    }
    if (filter.limit != null) {
      result = result.slice(0, filter.limit);
    }
    return result;
  };

  /**
   * Retorna un producto por su ID o null si no existe.
   *
   * @param {string|number} id
   * @returns {Object|null}
   */
  Whanda.prototype.getProduct = function (id) {
    return this.state.products.find((p) => p.id === id) || null;
  };

  /**
   * Retorna el precio de un producto (0 si no existe).
   * @param {string|number} id
   * @returns {number}
   */
  Whanda.prototype.getPrice = function (id) {
    return this._productProp(id, "price", 0);
  };

  /**
   * Retorna el stock de un producto (0 si no existe o no tiene stock).
   * @param {string|number} id
   * @returns {number}
   */
  Whanda.prototype.getStock = function (id) {
    return this._productProp(id, "stock", 0);
  };

  /**
   * Retorna las imágenes de un producto ([] si no tiene).
   * @param {string|number} id
   * @returns {string[]}
   */
  Whanda.prototype.getImages = function (id) {
    return this._productProp(id, "images", []);
  };

  /**
   * Retorna la categoría de un producto (null si no tiene).
   * @param {string|number} id
   * @returns {string|null}
   */
  Whanda.prototype.getCategory = function (id) {
    return this._productProp(id, "category", null);
  };

  /**
   * Retorna todas las categorías únicas del catálogo.
   * @returns {string[]}
   */
  Whanda.prototype.getCategories = function () {
    return [
      ...new Set(
        this.state.products
          .map((p) => p.category)
          .filter((c) => c != null && c !== "")
      ),
    ];
  };

  /**
   * Busca productos por nombre o categoría (case-insensitive).
   *
   * @param {string} query - Texto de búsqueda
   * @returns {Array<Object>} Productos coincidentes
   * @throws {Error} W001 si query no es un string
   */
  Whanda.prototype.search = function (query) {
    if (typeof query !== "string") {
      throw new Error(ERR.W001);
    }
    return this.getProducts({ search: query });
  };

  /**
   * Retorna todos los productos de una categoría.
   * @param {string} category
   * @returns {Array<Object>}
   */
  Whanda.prototype.filterByCategory = function (category) {
    return this.getProducts({ category });
  };

  /**
   * Retorna productos relacionados con uno dado.
   * Usa `relatedIds` si existen, si no retorna otros productos de la misma categoría.
   *
   * @param {string|number} productId
   * @returns {Array<Object>}
   */
  Whanda.prototype.getRelatedProducts = function (productId) {
    const product = this.getProduct(productId);
    if (!product) return [];
    const related = this._resolveProductIds(product, "relatedIds");
    if (related.length > 0) return related;
    return this.filterByCategory(product.category).filter(
      (p) => p.id !== productId
    );
  };

  /**
   * Retorna upsells de un producto (más caros que el actual).
   * Usa `upsellIds` si existen, si no productos de mayor precio en la categoría.
   *
   * @param {string|number} productId
   * @returns {Array<Object>}
   */
  Whanda.prototype.getUpsells = function (productId) {
    const product = this.getProduct(productId);
    if (!product) return [];
    const upsells = this._resolveProductIds(product, "upsellIds", (p) => p.price > product.price);
    if (upsells.length > 0) return upsells;
    return this.filterByCategory(product.category).filter(
      (p) => p.price > product.price && p.id !== productId
    );
  };

  /**
   * Retorna cross-sells de un producto.
   * Usa `crossSellIds` si existen, si no usa getRelatedProducts().
   *
   * @param {string|number} productId
   * @returns {Array<Object>}
   */
  Whanda.prototype.getCrossSells = function (productId) {
    const product = this.getProduct(productId);
    if (!product) return [];
    const crossSells = this._resolveProductIds(product, "crossSellIds");
    if (crossSells.length > 0) return crossSells;
    return this.getRelatedProducts(productId);
  };

  /**
   * Retorna productos sugeridos para agregar al carrito,
   * basándose en las categorías de los ítems actuales.
   *
   * @returns {Array<Object>} Productos que no están en el carrito
   */
  Whanda.prototype.getForCart = function () {
    if (this.state.cart.length === 0) return [];
    const cartProductIds = this.state.cart.map((item) => item.productId);
    const cartCategories = [
      ...new Set(
        this.state.cart
          .map((item) => this.getCategory(item.productId))
          .filter((c) => c != null)
      ),
    ];
    const seen = new Set();
    return this.state.products.filter((p) => {
      if (cartCategories.includes(p.category) && !cartProductIds.includes(p.id) && !seen.has(p.id)) {
        seen.add(p.id);
        return true;
      }
      return false;
    });
  };
}
