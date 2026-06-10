/**
 * Inicializa los métodos de escalabilidad en el prototipo de Whanda.
 *
 * Incluye carga desde fuentes remotas (JSON, Google Sheets, caché),
 * caché con TTL, paginación e iteración de productos.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initScalability(Whanda) {
  /**
   * Carga productos desde múltiples fuentes remotas.
   *
   * Tipos soportados:
   * - `json`: fetch de un URL que retorne JSON (array o { products: [...] })
   * - `sheets`: Google Sheets vía whanda-sheets.js
   * - `cache`: productos almacenados en caché local
   *
   * Rate limit: 10 solicitudes por minuto.
   *
   * @param {Array<Object>} sources - Fuentes de datos
   * @param {string} sources[].type - "json", "sheets" o "cache"
   * @param {string} [sources[].url] - URL de la fuente
   * @param {string} [sources[].proxyUrl] - URL del proxy (para Sheets)
   * @param {number} [sources[].timeout=15000] - Timeout en ms
   * @returns {Promise<Array<Object>>} Productos cargados
   * @throws {Error} Si se excede el rate limit
   */
  Whanda.prototype.loadFromSources = async function (sources) {
    if (!this._rateLimiters.sources) {
      this._rateLimiters.sources = this._createRateLimiter(10, 60000);
    }
    if (!this._rateLimiters.sources.check()) {
      throw new Error("Demasiadas solicitudes. Intenta de nuevo en un minuto.");
    }

    const allProducts = [];
    for (const source of sources) {
      try {
        if (source.type === "json") {
          const response = await fetch(source.url);
          if (response.ok) {
            const data = await response.json();
            const products = Array.isArray(data) ? data : data.products || [];
            allProducts.push(...products);
          }
        } else if (source.type === "sheets") {
          const { loadFromSheets } = await import("./whanda-sheets.js");
          const products = await loadFromSheets(this, {
            sheetUrl: source.url,
            proxyUrl: source.proxyUrl,
            timeout: source.timeout || 15000,
          });
          allProducts.push(...products);
        } else if (source.type === "cache") {
          const cached = this._getCache("whanda_products");
          if (cached) {
            allProducts.push(...cached);
          }
        }
      } catch (e) {
        console.warn(`Whanda: Failed to load from source "${source.type}":`, e.message);
      }
    }
    if (allProducts.length > 0) {
      this.setProducts(allProducts);
    }
    return allProducts;
  };

  /**
   * Almacena un valor en el caché local (localStorage) con TTL.
   *
   * @param {string} key - Clave del caché
   * @param {*} value - Valor a almacenar
   * @param {number} [ttl=3600] - Time-to-live en segundos
   */
  Whanda.prototype._setCache = function (key, value, ttl = 3600) {
    const item = {
      value,
      expires: Date.now() + ttl * 1000,
    };
    try {
      localStorage.setItem(`whanda_${key}`, JSON.stringify(item));
    } catch {
      // localStorage not available or full
    }
  };

  /**
   * Obtiene un valor del caché local.
   * Retorna null si no existe o expiró.
   *
   * @param {string} key - Clave del caché
   * @returns {*} Valor almacenado o null
   */
  Whanda.prototype._getCache = function (key) {
    try {
      const item = JSON.parse(localStorage.getItem(`whanda_${key}`));
      if (!item || Date.now() > item.expires) {
        localStorage.removeItem(`whanda_${key}`);
        return null;
      }
      return item.value;
    } catch {
      return null;
    }
  };

  /**
   * Elimina un valor del caché local, o todos los cachés de Whanda
   * si no se especifica clave.
   *
   * @param {string} [key] - Clave específica a eliminar (opcional)
   */
  Whanda.prototype._clearCache = function (key) {
    if (key) {
      localStorage.removeItem(`whanda_${key}`);
    } else {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("whanda_"));
      keys.forEach((k) => localStorage.removeItem(k));
    }
  };

  /**
   * Almacena los productos actuales en el caché local.
   *
   * @param {number} [ttl=3600] - Time-to-live en segundos
   */
  Whanda.prototype.cacheProducts = function (ttl = 3600) {
    this._setCache("products", this.state.products, ttl);
  };

  /**
   * Carga productos desde el caché local.
   * Los productos se sanitizan automáticamente contra XSS.
   *
   * @returns {boolean} true si se cargaron productos, false si no había caché
   */
  Whanda.prototype.loadProductsFromCache = function () {
    const cached = this._getCache("products");
    if (cached && Array.isArray(cached)) {
      this.state.products = this._sanitizeObject(cached);
      return true;
    }
    return false;
  };

  /**
   * Retorna productos paginados con filtros opcionales.
   *
   * @param {number} [page=1] - Número de página (1-indexed)
   * @param {number} [pageSize=20] - Productos por página
   * @param {Object} [filters={}] - Filtros (mismos que getProducts)
   * @returns {{ products: Array, total: number, page: number, pageSize: number, totalPages: number, hasNext: boolean, hasPrev: boolean }}
   */
  Whanda.prototype.getProductsPaginated = function (page = 1, pageSize = 20, filters = {}) {
    let filtered = this.getProducts(filters);
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const products = filtered.slice(start, start + pageSize);
    return {
      products,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  };

  /**
   * Crea un iterador de productos para procesamiento por lotes.
   * Útil para rendering incremental en catálogos grandes.
   *
   * @param {number} [batchSize=20] - Tamaño del lote
   * @returns {{ getNextBatch: () => Array, hasMore: () => boolean, reset: () => void, getTotal: () => number, getLoaded: () => number }}
   */
  Whanda.prototype.createProductIterator = function (batchSize = 20) {
    let currentIndex = 0;
    const products = this.state.products;
    return {
      getNextBatch: () => {
        const batch = products.slice(currentIndex, currentIndex + batchSize);
        currentIndex += batchSize;
        return batch;
      },
      hasMore: () => currentIndex < products.length,
      reset: () => {
        currentIndex = 0;
      },
      getTotal: () => products.length,
      getLoaded: () => currentIndex,
    };
  };
}
