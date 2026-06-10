import { ERR } from "./err.js";

/**
 * Realiza un deep merge de dos objetos.
 * Los arrays se reemplazan (no se concatenan).
 * Los objetos se fusionan recursivamente.
 * Los primitivos se sobrescriben.
 *
 * @param {Object} target - Objeto destino
 * @param {Object} source - Objeto fuente
 * @returns {Object} Objeto fusionado
 */
export function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Inicializa los métodos auxiliares privados (prefijo `_`) en el prototipo
 * de Whanda. Estos métodos son usados internamente por los demás mixins
 * y **no** forman parte de la API pública.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initHelpers(Whanda) {
  /**
   * Retorna una propiedad de un producto o un valor por defecto.
   * @param {string|number} id - ID del producto
   * @param {string} prop - Nombre de la propiedad
   * @param {*} fallback - Valor por defecto si la propiedad no existe
   * @returns {*} Valor de la propiedad o fallback
   */
  Whanda.prototype._productProp = function (id, prop, fallback) {
    const product = this.getProduct(id);
    return product && product[prop] != null ? product[prop] : fallback;
  };

  /**
   * Resuelve un arreglo de IDs de productos (relatedIds, upsellIds, etc.)
   * filtrando los que existan y opcionalmente aplicando un filtro adicional.
   * @param {Object} product - Objeto producto
   * @param {string} idField - Campo que contiene el arreglo de IDs
   * @param {Function|null} [filterFn=null] - Filtro opcional para cada producto resuelto
   * @returns {Array<Object>} Productos resueltos que pasan el filtro
   */
  Whanda.prototype._resolveProductIds = function (product, idField, filterFn = null) {
    const ids = product[idField];
    if (!ids || !Array.isArray(ids)) return [];
    let result = ids.map((id) => this.getProduct(id)).filter((p) => p !== null);
    if (filterFn) result = result.filter(filterFn);
    return result;
  };

  /**
   * Busca un ítem del carrito por su productId.
   * @param {string|number} productId
   * @returns {Object|undefined} Ítem del carrito o undefined
   */
  Whanda.prototype._findCartItem = function (productId) {
    return this.state.cart.find((i) => i.productId === productId);
  };

  /**
   * Verifica si un producto existe en el carrito.
   * @param {string|number} productId
   * @returns {boolean}
   */
  Whanda.prototype._hasCartItem = function (productId) {
    return this._findCartItem(productId) !== undefined;
  };

  /**
   * Retorna el umbral de envío gratis configurado (0 si no aplica).
   * @returns {number}
   */
  Whanda.prototype._freeShippingGoal = function () {
    const goal = this.config.shipping.freeFrom;
    return typeof goal === "number" && goal > 0 ? goal : 0;
  };

  /**
   * Valida que un valor sea un número positivo. Lanza error si no lo es.
   * @param {number} val
   * @param {string} name - Nombre del parámetro para el mensaje de error
   * @throws {Error} W036 si val no es positivo
   */
  Whanda.prototype._validatePositiveNumber = function (val, name) {
    if (typeof val !== "number" || !Number.isFinite(val) || val <= 0) {
      throw new Error(`${name} ${ERR.W036}`);
    }
  };

  /**
   * Construye un mensaje de error de stock insuficiente.
   * @param {string} name - Nombre del producto
   * @param {number} stock - Stock disponible
   * @returns {string} Mensaje de error
   */
  Whanda.prototype._stockError = function (name, stock) {
    return `${ERR.W004}: "${name}". Disponible: ${stock}`;
  };

  /**
   * Escapa caracteres HTML peligrosos en un string para prevenir XSS.
   * Convierte: & < > " '
   * @param {*} str - Valor a sanitizar
   * @returns {*} String sanitizado o el valor original si no es string
   */
  Whanda.prototype._sanitizeString = function (str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  };

  /**
   * Recursivamente sanitiza todas las cadenas de texto dentro de un objeto
   * o arreglo. Los valores no-string se mantienen sin cambios.
   * @param {Object|Array|*} obj - Objeto a sanitizar
   * @returns {Object|Array|*} Objeto con strings sanitizados
   */
  Whanda.prototype._sanitizeObject = function (obj) {
    if (obj === null || typeof obj !== "object") {
      return typeof obj === "string" ? this._sanitizeString(obj) : obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this._sanitizeObject(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = this._sanitizeString(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this._sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  /**
   * Crea un rate limiter deslizante (sliding window).
   * @param {number} [maxCalls=100] - Máximo de llamadas permitidas por ventana
   * @param {number} [windowMs=60000] - Duración de la ventana en milisegundos
   * @returns {{ check: () => boolean }} Objeto con método check()
   */
  Whanda.prototype._createRateLimiter = function (maxCalls = 100, windowMs = 60000) {
    const calls = [];
    return {
      check: () => {
        const now = Date.now();
        calls.push(now);
        while (calls.length > 0 && calls[0] < now - windowMs) {
          calls.shift();
        }
        return calls.length <= maxCalls;
      },
    };
  };
}
