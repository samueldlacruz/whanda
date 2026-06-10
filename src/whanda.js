// ================================
// WHANDA CORE FRAMEWORK
// Headless Catalog + WhatsApp Checkout
// ================================

const ERR = {
  W001: "search() requires a string",
  W002: "Product not found",
  W003: "quantity must be a positive integer",
  W004: "Insufficient stock",
  W005: "quantity must be a non-negative integer",
  W006: "Product not found in cart",
  W007: "Coupon code must be a string",
  W008: "Invalid coupon code",
  W009: "Coupon has expired",
  W010: "Coupon usage limit reached",
  W011: "Minimum order amount",
  W012: "Shipping value must be a non-negative number",
  W013: "Free shipping threshold must be a positive number",
  W014: "Per-item shipping value must be a non-negative number",
  W015: "Invalid shipping method",
  W016: "Invalid payment method",
  W017: "Invalid delivery method",
  W018: "Cart is empty",
  W019: "Customer name is required",
  W020: "Customer address is required",
  W021: "Payment method is required",
  W022: "Delivery method is required",
  W023: "Invalid status",
  W024: "Order not found",
  W025: "WhatsApp number not set",
  W026: "WhatsApp number must be a string or number",
  W027: "WhatsApp number must be between 7 and 15 digits",
  W028: "Template must be a function",
  W029: "Template not found",
  W030: "Cannot remove the default template",
  W031: "Template id must be a non-empty string",
  W032: "Active template not found",
  W033: "Coupon must have a valid 'code' string",
  W034: "Coupon must have a valid 'amount' number",
  W035: "setProducts() requires an array",
};

/**
 * Headless e-commerce framework for building product catalogs
 * with cart, dynamic pricing, and WhatsApp-optimized checkout.
 *
 * Flow: Discovery → Catalog → Cart → WhatsApp → Manual close
 *
 * @example
 * const whanda = new Whanda({ currency: "DOP" });
 * whanda.setProducts([...]);
 * await whanda.addItem("123");
 * whanda.setCustomerName("Juan");
 * const link = await whanda.sendToWhatsApp(order);
 */
export class Whanda {
  /**
   * Creates a new Whanda instance.
   *
   * @param {Object} [config={}] - Configuration options
   * @param {string} [config.currency="DOP"] - ISO 4217 currency code
   * @param {string} [config.locale="es-DO"] - Locale for formatting (e.g., "es-DO", "en-US")
   * @param {string|null} [config.whatsappNumber=null] - WhatsApp phone number (digits only)
   * @param {Object} [config.shipping] - Shipping configuration
   * @param {string} [config.shipping.type="fixed"] - Shipping type: "fixed", "free", or "per_item"
   * @param {number} [config.shipping.value=0] - Fixed shipping cost
   * @param {number|null} [config.shipping.freeFrom=null] - Minimum subtotal for free shipping
   * @param {number} [config.shipping.perItem=0] - Cost per item for per_item shipping
   * @param {string[]} [config.paymentMethods=["Cash","Bank Transfer"]] - Available payment methods
   * @param {string[]} [config.deliveryMethods=["Home Delivery","In-store Pickup"]] - Available delivery methods
   */
  constructor(config = {}) {
    this.config = {
      currency: "DOP",
      locale: "es-DO",
      whatsappNumber: null,
      shipping: { type: "fixed", value: 0, freeFrom: null, perItem: 0 },
      paymentMethods: ["Cash", "Bank Transfer"],
      deliveryMethods: ["Home Delivery", "In-store Pickup"],
      currencies: {},
      regions: {},
      storeName: "Mi Tienda",
      ...config,
    };

    this.state = {
      products: [],
      cart: [],
      coupons: [],
      coupon: null,
      customer: {
        name: null,
        address: null,
        notes: null,
      },
      checkout: {
        paymentMethod: null,
        deliveryMethod: null,
      },
      orders: [],
      downsell: null,
      seasons: [],
      urgency: {},
      bundles: [],
      cro: {
        freeShippingBar: false,
        freeShippingGoal: 0,
        lowStockAlert: false,
        socialProof: false,
        recentlyViewed: false,
        exitIntent: false,
        exitMessage: "",
        exitDiscount: 0,
      },
      recentlyViewed: [],
      activeCurrency: config.currency || "DOP",
      activeRegion: null,
    };

    this.hooks = {
      beforeAddToCart: [],
      afterAddToCart: [],
      afterCartChange: [],
      beforeCheckout: [],
      afterCheckout: [],
      beforeWhatsAppSend: [],
      beforeGenerateWhatsApp: [],
      afterGenerateWhatsApp: [],
      beforeSync: [],
      afterSync: [],
      onCartEmpty: [],
      onRemoveItem: [],
    };

    this.templates = {
      whatsapp: {
        default: { id: "default", fn: this._defaultWhatsAppTemplate() },
      },
      active: "default",
    };

    this._rateLimiters = {};
  }

  // =========================================================
  // PRIVATE HELPERS
  // =========================================================

  /**
   * Gets a product property with a fallback value.
   *
   * @param {string|number} id - Product identifier
   * @param {string} prop - Property name
   * @param {*} fallback - Fallback value if product or property not found
   * @returns {*} Property value or fallback
   * @private
   */
  _productProp(id, prop, fallback) {
    const product = this.getProduct(id);
    return product && product[prop] != null ? product[prop] : fallback;
  }

  /**
   * Resolves an array of product IDs to product objects.
   *
   * @param {Object} product - Source product
   * @param {string} idField - Field name containing the IDs array
   * @param {Function|null} [filterFn=null] - Optional filter function applied to resolved products
   * @returns {Object[]} Array of resolved product objects
   * @private
   */
  _resolveProductIds(product, idField, filterFn = null) {
    const ids = product[idField];
    if (!ids || !Array.isArray(ids)) return [];
    let result = ids.map((id) => this.getProduct(id)).filter((p) => p !== null);
    if (filterFn) result = result.filter(filterFn);
    return result;
  }

  /**
   * Finds a cart item by product ID.
   *
   * @param {string|number} productId - Product identifier
   * @returns {Object|undefined} Cart item or undefined
   * @private
   */
  _findCartItem(productId) {
    return this.state.cart.find((i) => i.productId === productId);
  }

  /**
   * Checks if a product is in the cart.
   *
   * @param {string|number} productId - Product identifier
   * @returns {boolean} True if the product is in the cart
   * @private
   */
  _hasCartItem(productId) {
    return this._findCartItem(productId) !== undefined;
  }

  /**
   * Returns the free shipping threshold number.
   *
   * @returns {number} Free shipping threshold (0 if not set)
   * @private
   */
  _freeShippingGoal() {
    const goal = this.config.shipping.freeFrom;
    return typeof goal === "number" && goal > 0 ? goal : 0;
  }

  /**
   * Validates that a value is a valid positive number.
   *
   * @param {*} val - Value to validate
   * @param {string} name - Name for the error message
   * @throws {Error} If val is not a valid positive number
   * @private
   */
  _validatePositiveNumber(val, name) {
    if (typeof val !== "number" || !Number.isFinite(val) || val <= 0) {
      throw new Error(`${name} must be a positive number`);
    }
  }

  /**
   * Returns a formatted insufficient stock error message.
   *
   * @param {string} name - Product name
   * @param {number} stock - Available stock
   * @returns {string} Formatted error message
   * @private
   */
  _stockError(name, stock) {
    return `Insufficient stock for "${name}". Available: ${stock}`;
  }

  /**
   * Sanitizes a string by escaping HTML entities.
   * Prevents XSS when rendering user-provided content.
   *
   * @param {*} str - Value to sanitize
   * @returns {*} Sanitized string, or original value if not a string
   * @private
   */
  _sanitizeString(str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  /**
   * Sanitizes all string properties in an object (recursive).
   *
   * @param {*} obj - Object, array, or primitive to sanitize
   * @returns {*} Sanitized copy with escaped strings
   * @private
   */
  _sanitizeObject(obj) {
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
  }

  /**
   * Creates a rate limiter for API calls.
   *
   * @param {number} maxCalls - Maximum calls per window
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Rate limiter with check() method
   * @private
   */
  _createRateLimiter(maxCalls = 100, windowMs = 60000) {
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
  }

  // =========================================================
  // CONFIGURATION
  // =========================================================

  /**
   * Returns a copy of the current configuration.
   *
   * @returns {Object} Copy of the configuration object
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Merges partial config into the current configuration (shallow merge).
   *
   * @param {Object} partialConfig - Partial configuration to merge
   * @example
   * whanda.updateConfig({ currency: "USD", locale: "en-US" });
   */
  updateConfig(partialConfig) {
    this.config = { ...this.config, ...partialConfig };
  }

  // =========================================================
  // MULTI-CURRENCY
  // =========================================================

  /**
   * Sets the active currency for price display.
   *
   * @param {string} currencyCode - ISO 4217 currency code (e.g., "USD", "DOP", "EUR")
   * @throws {Error} If currency is not in supported currencies list
   */
  setCurrency(currencyCode) {
    const supported = Object.keys(this.config.currencies);
    if (supported.length > 0 && !supported.includes(currencyCode)) {
      throw new Error(`Currency "${currencyCode}" is not supported. Supported: ${supported.join(", ")}`);
    }
    this.state.activeCurrency = currencyCode;
  }

  /**
   * Returns the active currency code.
   *
   * @returns {string} Active currency code
   */
  getCurrency() {
    return this.state.activeCurrency;
  }

  /**
   * Returns the exchange rate for a currency relative to the base currency.
   *
   * @param {string} currencyCode - Currency code to get rate for
   * @returns {number} Exchange rate (1.0 if same as base or not configured)
   */
  getExchangeRate(currencyCode) {
    if (!this.config.currencies[currencyCode]) return 1;
    return this.config.currencies[currencyCode];
  }

  /**
   * Converts a price from base currency to the active currency.
   *
   * @param {number} basePrice - Price in base currency
   * @returns {number} Converted price in active currency
   */
  convertPrice(basePrice) {
    if (typeof basePrice !== "number" || !Number.isFinite(basePrice)) return 0;
    const rate = this.getExchangeRate(this.state.activeCurrency);
    return Math.round(basePrice * rate * 100) / 100;
  }

  /**
   * Formats a price with currency symbol using locale formatting.
   *
   * @param {number} amount - Amount to format
   * @param {string} [currencyCode] - Currency code (defaults to active currency)
   * @returns {string} Formatted price string
   */
  formatPrice(amount, currencyCode) {
    const code = currencyCode || this.state.activeCurrency;
    try {
      return new Intl.NumberFormat(this.config.locale, {
        style: "currency",
        currency: code,
      }).format(amount);
    } catch {
      return `${code} ${amount.toFixed(2)}`;
    }
  }

  // =========================================================
  // MULTI-REGION
  // =========================================================

  /**
   * Sets the active region for tax and shipping calculations.
   *
   * @param {string} regionCode - Region code (e.g., "DO", "US", "PR")
   * @throws {Error} If region is not in supported regions list
   */
  setRegion(regionCode) {
    const supported = Object.keys(this.config.regions);
    if (supported.length > 0 && !supported.includes(regionCode)) {
      throw new Error(`Region "${regionCode}" is not supported. Supported: ${supported.join(", ")}`);
    }
    this.state.activeRegion = regionCode;

    const region = this.config.regions[regionCode];
    if (region && region.currency) {
      this.state.activeCurrency = region.currency;
    }
  }

  /**
   * Returns the active region code.
   *
   * @returns {string|null} Active region code
   */
  getRegion() {
    return this.state.activeRegion;
  }

  /**
   * Returns the tax rate for the active region.
   *
   * @param {string} [productId] - Optional product ID for product-specific tax
   * @returns {number} Tax rate (0-1), e.g., 0.18 for 18%
   */
  getTax(productId) {
    const region = this.config.regions[this.state.activeRegion];
    if (!region || !region.tax) return 0;
    if (typeof region.tax === "number") return region.tax;
    if (typeof region.tax === "object" && region.tax.rate !== undefined) {
      return region.tax.rate;
    }
    return 0;
  }

  /**
   * Returns the tax name for the active region (e.g., "ITBIS", "IVU", "Tax").
   *
   * @returns {string} Tax name
   */
  getTaxName() {
    const region = this.config.regions[this.state.activeRegion];
    if (!region || !region.tax) return "Tax";
    if (typeof region.tax === "object" && region.tax.name) {
      return region.tax.name;
    }
    return "Tax";
  }

  /**
   * Returns the shipping cost for the active region based on cart subtotal.
   *
   * @param {number} [subtotal] - Cart subtotal (uses current cart if not provided)
   * @returns {number} Shipping cost in active currency
   */
  getRegionalShippingCost(subtotal) {
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
  }

  // =========================================================
  // HOOK SYSTEM
  // =========================================================

  /**
   * Registers a hook function. If the hook name is not recognized,
   * a warning is logged and the function is not registered.
   *
   * @param {string} hook - Hook name (e.g., "beforeAddToCart", "afterCheckout")
   * @param {Function} fn - Callback function. Receives payload, can return modified payload.
   *   Return `{ abort: true, message: "..." }` to stop execution.
   * @example
   * whanda.on("beforeAddToCart", (payload) => {
   *   console.log("Adding:", payload.productId);
   *   return payload;
   * });
   */
  on(hook, fn) {
    if (!this.hooks[hook]) {
      console.warn(`Whanda: unknown hook "${hook}"`);
      return;
    }
    this.hooks[hook].push(fn);
  }

  /**
   * Unregisters a previously registered hook function.
   *
   * @param {string} hook - Hook name
   * @param {Function} fn - The exact function reference passed to `on()`
   */
  off(hook, fn) {
    if (!this.hooks[hook]) return;
    this.hooks[hook] = this.hooks[hook].filter((f) => f !== fn);
  }

  /**
   * Executes all registered hooks for a given hook name sequentially.
   * Each hook receives the payload and can return a modified version.
   * Hooks can abort by returning `{ abort: true, message: "..." }`.
   *
   * @param {string} hook - Hook name to execute
   * @param {*} payload - Data passed to each hook function
   * @returns {Promise<*>} Final payload after all hooks have run
   * @throws {Error} If a hook returns `{ abort: true }`
   */
  async runHooks(hook, payload) {
    if (!this.hooks[hook]) return payload;
    let result = payload;
    for (const fn of this.hooks[hook]) {
      try {
        const res = await fn(result);
        if (res !== undefined && res !== null) result = res;
        if (res && typeof res === "object" && res.abort === true) {
          const err = new Error(res.message || `Hook "${hook}" aborted`);
          err._whandaAborted = true;
          throw err;
        }
      } catch (err) {
        if (err._whandaAborted) throw err;
        console.error(`Whanda: hook "${hook}" error:`, err);
      }
    }
    return result;
  }

  // =========================================================
  // PRODUCTS
  // =========================================================

  /**
   * Replaces the entire product catalog.
   *
   * @param {Object[]} products - Array of product objects
   * @param {string|number} products[].id - Unique product identifier
   * @param {string} products[].name - Product name
   * @param {number} products[].price - Product price
   * @param {number} [products[].stock] - Available stock (null = unlimited)
   * @param {string} products[].category - Product category
   * @param {string} [products[].image] - Primary image URL
   * @param {string[]} [products[].relatedIds] - IDs of related products
   * @param {string[]} [products[].upsellIds] - IDs of upsell products
   * @param {string[]} [products[].crossSellIds] - IDs of cross-sell products
   * @throws {Error} If products is not an array
   * @example
   * whanda.setProducts([
   *   { id: "1", name: "Camisa", price: 1200, stock: 25, category: "Ropa", image: "camisa.jpg" }
   * ]);
   */
  setProducts(products) {
    if (!Array.isArray(products)) {
      throw new Error(ERR.W035);
    }
    this.state.products = products;
  }

  /**
   * Returns products with optional filtering, sorting, and pagination.
   *
   * @param {Object} [filter={}] - Filter options
   * @param {string} [filter.category] - Filter by category
   * @param {number} [filter.minPrice] - Minimum price
   * @param {number} [filter.maxPrice] - Maximum price
   * @param {string} [filter.search] - Search term (matches name or category)
   * @param {string} [filter.sort] - Field to sort by (e.g., "price", "name")
   * @param {string} [filter.order="asc"] - Sort order: "asc" or "desc"
   * @param {number} [filter.limit] - Maximum number of results
   * @returns {Object[]} Filtered array of products
   * @example
   * const expensive = whanda.getProducts({ minPrice: 2000, sort: "price", order: "desc" });
   */
  getProducts(filter = {}) {
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
  }

  /**
   * Returns a product by its ID.
   *
   * @param {string|number} id - Product identifier
   * @returns {Object|null} Product object or null if not found
   */
  getProduct(id) {
    return this.state.products.find((p) => p.id === id) || null;
  }

  /**
   * Returns the price of a product.
   *
   * @param {string|number} id - Product identifier
   * @returns {number} Product price, or 0 if not found
   */
  getPrice(id) {
    return this._productProp(id, "price", 0);
  }

  /**
   * Returns the stock of a product.
   *
   * @param {string|number} id - Product identifier
   * @returns {number} Stock count, or 0 if not found or stock is not set
   */
  getStock(id) {
    return this._productProp(id, "stock", 0);
  }

  /**
   * Returns the images array of a product.
   *
   * @param {string|number} id - Product identifier
   * @returns {string[]} Array of image URLs, or empty array if not found
   */
  getImages(id) {
    return this._productProp(id, "images", []);
  }

  /**
   * Returns the category of a product.
   *
   * @param {string|number} id - Product identifier
   * @returns {string|null} Category name, or null if not found
   */
  getCategory(id) {
    return this._productProp(id, "category", null);
  }

  /**
   * Returns all unique category names from the catalog.
   *
   * @returns {string[]} Array of unique category names
   */
  getCategories() {
    return [
      ...new Set(
        this.state.products
          .map((p) => p.category)
          .filter((c) => c != null && c !== "")
      ),
    ];
  }

  /**
   * Searches products by name or category (case-insensitive).
   *
   * @param {string} query - Search term
   * @returns {Object[]} Matching products
   * @throws {Error} If query is not a string
   * @example
   * const results = whanda.search("camisa");
   */
  search(query) {
    if (typeof query !== "string") {
      throw new Error(ERR.W001);
    }
    return this.getProducts({ search: query });
  }

  /**
   * Returns all products in a specific category.
   *
   * @param {string} category - Category name to filter by
   * @returns {Object[]} Products in the category
   */
  filterByCategory(category) {
    return this.getProducts({ category });
  }

  /**
   * Returns related products for a given product.
   * Uses `relatedIds` if defined, otherwise falls back to same-category products.
   *
   * @param {string|number} productId - Product identifier
   * @returns {Object[]} Array of related products (excludes the source product)
   */
  getRelatedProducts(productId) {
    const product = this.getProduct(productId);
    if (!product) return [];

    const related = this._resolveProductIds(product, "relatedIds");
    if (related.length > 0) return related;

    return this.filterByCategory(product.category).filter(
      (p) => p.id !== productId
    );
  }

  /**
   * Returns upsell products — higher-priced items from the same category.
   * Uses `upsellIds` if defined on the product.
   *
   * @param {string|number} productId - Product identifier
   * @returns {Object[]} Array of upsell products
   */
  getUpsells(productId) {
    const product = this.getProduct(productId);
    if (!product) return [];

    const upsells = this._resolveProductIds(product, "upsellIds", (p) => p.price > product.price);
    if (upsells.length > 0) return upsells;

    return this.filterByCategory(product.category).filter(
      (p) => p.price > product.price && p.id !== productId
    );
  }

  /**
   * Returns cross-sell products — complementary items.
   * Uses `crossSellIds` if defined, otherwise falls back to related products.
   *
   * @param {string|number} productId - Product identifier
   * @returns {Object[]} Array of cross-sell products
   */
  getCrossSells(productId) {
    const product = this.getProduct(productId);
    if (!product) return [];

    const crossSells = this._resolveProductIds(product, "crossSellIds");
    if (crossSells.length > 0) return crossSells;

    return this.getRelatedProducts(productId);
  }

  /**
   * Returns products from the same categories as the current cart,
   * excluding items already in the cart. Deduplicates results.
   *
   * @returns {Object[]} Recommended products for the current cart
   */
  getForCart() {
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
  }

  // =========================================================
  // CART
  // =========================================================

  /**
   * Returns a copy of the current cart items.
   *
   * @returns {Object[]} Cart items array
   */
  getCart() {
    return [...this.state.cart];
  }

  /**
   * Adds a product to the cart. If the product already exists,
   * increments its quantity. Validates stock availability.
   * Fires `beforeAddToCart`, `afterAddToCart`, and `afterCartChange` hooks.
   *
   * @param {string|number} productId - Product identifier
   * @param {number} [quantity=1] - Quantity to add (must be positive integer)
   * @returns {Promise<void>}
   * @throws {Error} If product not found, quantity invalid, or insufficient stock
   * @example
   * await whanda.addItem("123", 2);
   */
  async addItem(productId, quantity = 1) {
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
          this._stockError(product.name, product.stock) + `, in cart: ${existing.quantity}`
        );
      }
      existing.quantity = newQty;
    } else {
      this.state.cart.push({
        productId,
        quantity,
        price: product.price,
        name: product.name,
      });
    }

    await this.runHooks("afterAddToCart", this.state.cart);
    await this.runHooks("afterCartChange", this.state.cart);
  }

  /**
   * Clears all items from the cart. Fires `afterCartChange` hook.
   */
  clearCart() {
    this.runHooks("onCartEmpty", { cart: [...this.state.cart] });
    this.state.cart = [];
    this.runHooks("afterCartChange", this.state.cart);
  }

  /**
   * Removes a specific product from the cart. Fires `afterCartChange` hook.
   *
   * @param {string|number} productId - Product identifier to remove
   */
  removeCartItem(productId) {
    this.runHooks("onRemoveItem", { productId, cart: [...this.state.cart] });
    this.state.cart = this.state.cart.filter(
      (item) => item.productId !== productId
    );
    this.runHooks("afterCartChange", this.state.cart);
  }

  /**
   * Updates the quantity of a cart item. If quantity is 0, removes the item.
   * Validates stock availability. Fires `afterCartChange` hook.
   *
   * @param {string|number} productId - Product identifier
   * @param {number} quantity - New quantity (non-negative integer)
   * @throws {Error} If product not in cart, quantity invalid, or insufficient stock
   */
  updateQuantity(productId, quantity) {
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
      this.runHooks("afterCartChange", this.state.cart);
    }
  }

  /**
   * Checks if a product is in the cart.
   *
   * @param {string|number} productId - Product identifier
   * @returns {boolean} True if the product is in the cart
   */
  hasCartItem(productId) {
    return this._hasCartItem(productId);
  }

  /**
   * Returns the total number of items in the cart (sum of all quantities).
   *
   * @returns {number} Total item count
   */
  getCartItemCount() {
    return this.state.cart.reduce((count, item) => count + item.quantity, 0);
  }

  // =========================================================
  // PRICING
  // =========================================================

  /**
   * Calculates the cart subtotal (sum of price × quantity for all items).
   *
   * @returns {number} Subtotal amount
   */
  getSubtotal() {
    return this.state.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  /**
   * Calculates the shipping cost based on the current shipping config.
   * Supports fixed, free (above threshold), and per-item shipping.
   *
   * @returns {number} Shipping cost
   */
  getShippingCost() {
    const subtotal = this.getSubtotal();
    const freeFrom = this._freeShippingGoal();
    if (freeFrom > 0 && subtotal >= freeFrom) {
      return 0;
    }
    if (this.config.shipping.type === "fixed") {
      return this.config.shipping.value;
    }
    if (this.config.shipping.type === "per_item") {
      const totalItems = this.getCartItemCount();
      return this.config.shipping.perItem * totalItems;
    }
    return 0;
  }

  /**
   * Calculates the discount amount from the active coupon.
   * Supports flat amount and percentage discounts.
   *
   * @returns {number} Discount amount (0 if no coupon active)
   */
  getDiscountAmount() {
    if (!this.state.coupon) return 0;
    const coupon = this.state.coupon;
    const subtotal = this.getSubtotal();

    if (coupon.type === "percent") {
      const amount = subtotal * (coupon.amount / 100);
      return coupon.maxDiscount != null ? Math.min(amount, coupon.maxDiscount) : amount;
    }

    return coupon.amount || 0;
  }

  /**
   * Calculates the order total: subtotal - discount + shipping + tax.
   * Never returns a negative value.
   *
   * @returns {number} Total amount
   */
  getTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingCost();
    const taxRate = this.getTax();
    const taxAmount = Math.round((subtotal - discount) * taxRate * 100) / 100;
    const total = subtotal - discount + shipping + taxAmount;
    return Math.max(0, total);
  }

  /**
   * Returns a full pricing breakdown including tax.
   *
   * @returns {Object} Pricing summary
   * @returns {number} return.subtotal - Cart subtotal
   * @returns {number} return.shipping - Shipping cost
   * @returns {number} return.discount - Discount amount
   * @returns {number} return.tax - Tax amount
   * @returns {number} return.taxRate - Tax rate (0-1)
   * @returns {number} return.total - Final total
   */
  calculate() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const taxRate = this.getTax();
    const taxAmount = Math.round((subtotal - discount) * taxRate * 100) / 100;

    return {
      subtotal,
      shipping: this.getShippingCost(),
      discount,
      tax: taxAmount,
      taxRate,
      total: this.getTotal(),
    };
  }

  /**
   * Formats a numeric amount using the configured currency and locale.
   *
  // =========================================================
  // DISCOUNTS / COUPONS
  // =========================================================

  /**
   * Registers a coupon in the system.
   *
   * @param {Object} coupon - Coupon definition
   * @param {string} coupon.code - Unique coupon code (required)
   * @param {number} coupon.amount - Discount amount (required). For percent coupons, this is the percentage.
   * @param {string} [coupon.type="flat"] - Discount type: "flat" or "percent"
   * @param {number} [coupon.minOrder] - Minimum cart subtotal required
   * @param {string} [coupon.expiresAt] - Expiration date (ISO string)
   * @param {number} [coupon.maxUses] - Maximum usage count
   * @throws {Error} If coupon is missing required fields
   * @example
   * whanda.addCoupon({ code: "SAVE10", amount: 10, type: "percent", minOrder: 500 });
   */
  addCoupon(coupon) {
    if (!coupon || typeof coupon.code !== "string" || coupon.code.trim() === "") {
      throw new Error(ERR.W033);
    }
    if (coupon.amount == null || typeof coupon.amount !== "number" || coupon.amount < 0) {
      throw new Error(ERR.W034);
    }
    this.state.coupons.push(coupon);
  }

  /**
   * Returns all registered coupons.
   *
   * @returns {Object[]} Array of coupon objects
   */
  getCoupons() {
    return [...this.state.coupons];
  }

  /**
   * Checks if a coupon code exists in the system.
   *
   * @param {string} code - Coupon code to validate
   * @returns {boolean} True if the coupon exists
   */
  validateCoupon(code) {
    if (typeof code !== "string") return false;
    return this.state.coupons.some((c) => c.code === code);
  }

  /**
   * Applies a coupon code as the active discount.
   * Validates expiry, usage limits, and minimum order amount.
   *
   * @param {string} code - Coupon code to apply
   * @throws {Error} If code is invalid, expired, at max uses, or below minimum order
   * @example
   * whanda.applyCoupon("SAVE10");
   */
  applyCoupon(code) {
    if (typeof code !== "string") {
      throw new Error(ERR.W007);
    }

    const coupon = this.state.coupons.find((c) => c.code === code);
    if (!coupon) throw new Error(ERR.W008);

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new Error(ERR.W009);
    }

    if (coupon.maxUses != null && (coupon.usedCount || 0) >= coupon.maxUses) {
      throw new Error(ERR.W010);
    }

    if (coupon.minOrder != null && this.getSubtotal() < coupon.minOrder) {
      throw new Error(`${ERR.W011} for this coupon is ${coupon.minOrder}`);
    }

    this.state.coupon = coupon;
    return { ...coupon };
  }

  /**
   * Removes the currently active coupon.
   */
  removeCoupon() {
    this.state.coupon = null;
  }

  /**
   * Returns the currently active coupon (copy), or null if none.
   *
   * @returns {Object|null} Active coupon object or null
   */
  getActiveCoupon() {
    return this.state.coupon ? { ...this.state.coupon } : null;
  }

  // =========================================================
  // SHIPPING
  // =========================================================

  /**
   * Returns the list of available shipping method types.
   *
   * @returns {string[]} Array of shipping types: "fixed", "free", "per_item"
   */
  getShippingMethods() {
    return ["fixed", "free", "per_item"];
  }

  /**
   * Sets the shipping method type.
   *
   * @param {string} method - Shipping type: "fixed", "free", or "per_item"
   * @throws {Error} If method is not valid
   */
  setShippingMethod(method) {
    if (!this.getShippingMethods().includes(method)) {
      throw new Error(ERR.W015);
    }
    this.config.shipping.type = method;
  }

  /**
   * Checks if shipping is currently free (cost is 0).
   *
   * @returns {boolean} True if shipping cost is 0
   */
  isFreeShipping() {
    return this.getShippingCost() === 0;
  }

  /**
   * Returns the minimum subtotal for free shipping.
   *
   * @returns {number|null} Free shipping threshold, or null if not set
   */
  getFreeShippingMin() {
    return this.config.shipping.freeFrom;
  }

  /**
   * Sets a fixed shipping cost and switches to "fixed" mode.
   *
   * @param {number} value - Shipping cost (non-negative)
   * @throws {Error} If value is not a non-negative number
   */
  setFixedShipping(value) {
    if (typeof value !== "number" || value < 0) {
      throw new Error(ERR.W012);
    }
    this.config.shipping.type = "fixed";
    this.config.shipping.value = value;
  }

  /**
   * Sets the minimum subtotal for free shipping.
   *
   * @param {number} threshold - Minimum subtotal amount (must be positive)
   * @throws {Error} If threshold is not a positive number
   */
  setFreeShippingFrom(threshold) {
    this._validatePositiveNumber(threshold, ERR.W013);
    this.config.shipping.freeFrom = threshold;
  }

  /**
   * Sets per-item shipping cost and switches to "per_item" mode.
   *
   * @param {number} value - Cost per item (non-negative)
   * @throws {Error} If value is not a non-negative number
   */
  setPerItemShipping(value) {
    if (typeof value !== "number" || value < 0) {
      throw new Error(ERR.W014);
    }
    this.config.shipping.type = "per_item";
    this.config.shipping.perItem = value;
  }

  // =========================================================
  // CUSTOMER
  // =========================================================

  /**
   * Sets the customer's name.
   *
   * @param {string} name - Customer name
   */
  setCustomerName(name) {
    this.state.customer.name = name;
  }

  /**
   * Sets the customer's delivery address.
   *
   * @param {string} address - Delivery address
   */
  setCustomerAddress(address) {
    this.state.customer.address = address;
  }

  /**
   * Sets additional notes for the order.
   *
   * @param {string} notes - Order notes
   */
  setCustomerNotes(notes) {
    this.state.customer.notes = notes;
  }

  /**
   * Returns a copy of the customer information.
   *
   * @returns {Object} Customer object with name, address, and notes
   */
  getCustomer() {
    return { ...this.state.customer };
  }

  // =========================================================
  // CHECKOUT
  // =========================================================

  /**
   * Returns available payment methods.
   *
   * @returns {string[]} Array of payment method names
   */
  getPaymentMethods() {
    return [...this.config.paymentMethods];
  }

  /**
   * Sets the payment method for checkout.
   *
   * @param {string} method - Payment method name
   * @throws {Error} If method is not in the configured payment methods
   */
  setPaymentMethod(method) {
    if (!this.getPaymentMethods().includes(method)) {
      throw new Error(ERR.W016);
    }
    this.state.checkout.paymentMethod = method;
  }

  /**
   * Returns available delivery methods.
   *
   * @returns {string[]} Array of delivery method names
   */
  getDeliveryMethods() {
    return [...this.config.deliveryMethods];
  }

  /**
   * Sets the delivery method for checkout.
   *
   * @param {string} method - Delivery method name
   * @throws {Error} If method is not in the configured delivery methods
   */
  setDeliveryMethod(method) {
    if (!this.getDeliveryMethods().includes(method)) {
      throw new Error(ERR.W017);
    }
    this.state.checkout.deliveryMethod = method;
  }

  /**
   * Validates that all required checkout data is present.
   * Checks: cart not empty, customer name, address, payment and delivery methods.
   *
   * @returns {true} Returns true if valid
   * @throws {Error} If any required field is missing
   */
  validateCheckout() {
    if (this.state.cart.length === 0) throw new Error(ERR.W018);
    if (!this.state.customer.name) throw new Error(ERR.W019);
    if (!this.state.customer.address) throw new Error(ERR.W020);
    if (!this.state.checkout.paymentMethod) throw new Error(ERR.W021);
    if (!this.state.checkout.deliveryMethod) throw new Error(ERR.W022);
    return true;
  }

  /**
   * Returns a preview of the order before creation.
   *
   * @returns {Object} Order preview with items, customer, payment, delivery, and pricing
   */
  preview() {
    const pricing = this.calculate();
    return {
      items: this.getCart(),
      customer: this.getCustomer(),
      paymentMethod: this.state.checkout.paymentMethod,
      deliveryMethod: this.state.checkout.deliveryMethod,
      ...pricing,
    };
  }

  /**
   * Creates a new order. Validates checkout, fires hooks,
   * stores the order, and clears cart/coupon/checkout state.
   * Increments coupon `usedCount` if a coupon was applied.
   *
   * @param {Object} [meta={}] - Arbitrary metadata to attach to the order
   * @returns {Promise<Object>} Created order object
   * @throws {Error} If checkout validation fails
   * @example
   * const order = await whanda.createOrder({ note: "Gift wrap please" });
   * console.log(order.id); // Order ID
   */
  async createOrder(meta = {}) {
    this.validateCheckout();
    await this.runHooks("beforeCheckout", meta);

    const pricing = this.calculate();
    const order = {
      id: Date.now(),
      items: structuredClone(this.state.cart),
      subtotal: pricing.subtotal,
      shipping: pricing.shipping,
      discount: pricing.discount,
      tax: pricing.tax,
      taxRate: pricing.taxRate,
      taxName: this.getTaxName(),
      total: pricing.total,
      currency: this.state.activeCurrency,
      region: this.state.activeRegion,
      customer: { ...this.state.customer },
      paymentMethod: this.state.checkout.paymentMethod,
      deliveryMethod: this.state.checkout.deliveryMethod,
      status: "pending",
      meta,
      createdAt: new Date().toISOString(),
    };

    if (this.state.coupon) {
      const couponIdx = this.state.coupons.findIndex(
        (c) => c.code === this.state.coupon.code
      );
      if (couponIdx !== -1) {
        this.state.coupons[couponIdx].usedCount =
          (this.state.coupons[couponIdx].usedCount || 0) + 1;
      }
    }

    this.state.orders.push(order);

    this.state.cart = [];
    this.state.coupon = null;
    this.state.checkout = { paymentMethod: null, deliveryMethod: null };

    await this.runHooks("afterCheckout", order);
    await this.runHooks("afterCartChange", this.state.cart);
    return order;
  }

  // =========================================================
  // ORDERS
  // =========================================================

  /**
   * Returns an order by its ID.
   *
   * @param {number} id - Order ID (timestamp)
   * @returns {Object|null} Order object or null if not found
   */
  getOrder(id) {
    return this.state.orders.find((o) => o.id === id) || null;
  }

  /**
   * Returns the most recently created order.
   *
   * @returns {Object|null} Last order or null if no orders exist
   */
  getLastOrder() {
    return this.state.orders[this.state.orders.length - 1] || null;
  }

  /**
   * Returns all orders (copy).
   *
   * @returns {Object[]} Array of order objects
   */
  listOrders() {
    return [...this.state.orders];
  }

  /**
   * Updates the status of an order.
   *
   * @param {number} id - Order ID
   * @param {string} status - New status: "pending", "confirmed", "shipped", "delivered", or "cancelled"
   * @returns {Object} Updated order
   * @throws {Error} If status is invalid or order not found
   */
  updateOrderStatus(id, status) {
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new Error(`${ERR.W023}. Must be one of: ${validStatuses.join(", ")}`);
    }
    const order = this.state.orders.find((o) => o.id === id);
    if (!order) throw new Error(ERR.W024);
    order.status = status;
    return order;
  }

  /**
   * Cancels and removes an order from the list.
   *
   * @param {number} id - Order ID
   * @returns {Object} The cancelled order
   * @throws {Error} If order not found
   */
  cancelOrder(id) {
    const index = this.state.orders.findIndex((o) => o.id === id);
    if (index === -1) throw new Error(ERR.W024);
    const order = this.state.orders.splice(index, 1)[0];
    return order;
  }

  // =========================================================
  // PERSISTENCE
  // =========================================================

  /**
   * Serializes the current state (config, state, active template) to a JSON string.
   * Useful for localStorage or any persistence layer.
   *
   * @returns {string} JSON string
   * @example
   * localStorage.setItem("whanda", whanda.save());
   */
  save() {
    return JSON.stringify({
      config: this.config,
      state: this.state,
      templates: {
        active: this.templates.active,
      },
    });
  }

  /**
   * Restores state from a JSON string previously created with `save()`.
   * Merges loaded data into the current instance (shallow merge).
   *
   * @param {string} jsonString - JSON string from `save()`
   * @throws {Error} If jsonString is not valid JSON
   * @example
   * const saved = localStorage.getItem("whanda");
   * if (saved) whanda.load(saved);
   */
  load(jsonString) {
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`Invalid JSON in load(): ${e.message}`);
    }

    if (data === null || typeof data !== "object") {
      throw new Error("load() expects a JSON object");
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
  }

  /**
   * Resets transient state: cart, active coupon, customer info, and checkout selections.
   * Does NOT reset products, config, or orders.
   */
  reset() {
    this.state.cart = [];
    this.state.coupon = null;
    this.state.customer = { name: null, address: null, notes: null };
    this.state.checkout = { paymentMethod: null, deliveryMethod: null };
  }

  // =========================================================
  // SYNC
  // =========================================================

  /**
   * Passes data through before/after sync hooks.
   * Intended for external synchronization (API, database, etc.).
   *
   * @param {*} data - Data to sync
   * @returns {Promise<*>} The data after hooks
   */
  async sync(data) {
    let payload = await this.runHooks("beforeSync", data);
    const result = payload;
    await this.runHooks("afterSync", result);
    return result;
  }

  // =========================================================
  // SCALABILITY - DATA SOURCES & CACHE
  // =========================================================

  /**
   * Loads products from multiple data sources.
   *
   * @param {Array} sources - Array of data source configs
   * @param {string} sources[].type - Source type: "json", "sheets", or "cache"
   * @param {string} [sources[].url] - URL for JSON or Sheets sources
   * @param {string} [sources[].proxyUrl] - Proxy URL for Sheets
   * @param {number} [sources[].ttl=3600] - Cache TTL in seconds
   * @returns {Promise<Object[]>} All loaded products
   */
  async loadFromSources(sources) {
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
  }

  /**
   * Sets cache with TTL (time-to-live).
   *
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [ttl=3600] - TTL in seconds
   */
  _setCache(key, value, ttl = 3600) {
    const item = {
      value,
      expires: Date.now() + ttl * 1000,
    };
    try {
      localStorage.setItem(`whanda_${key}`, JSON.stringify(item));
    } catch {
      // localStorage not available or full
    }
  }

  /**
   * Gets value from cache. Returns null if expired or not found.
   *
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  _getCache(key) {
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
  }

  /**
   * Clears a specific cache key or all Whanda cache.
   *
   * @param {string} [key] - Cache key to clear (clears all if omitted)
   */
  _clearCache(key) {
    if (key) {
      localStorage.removeItem(`whanda_${key}`);
    } else {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("whanda_"));
      keys.forEach((k) => localStorage.removeItem(k));
    }
  }

  /**
   * Caches current products to localStorage.
   *
   * @param {number} [ttl=3600] - TTL in seconds
   */
  cacheProducts(ttl = 3600) {
    this._setCache("products", this.state.products, ttl);
  }

  /**
   * Loads products from cache if available.
   *
   * @returns {boolean} True if products were loaded from cache
   */
  loadProductsFromCache() {
    const cached = this._getCache("products");
    if (cached && Array.isArray(cached)) {
      this.state.products = cached;
      return true;
    }
    return false;
  }

  // =========================================================
  // SCALABILITY - PAGINATION
  // =========================================================

  /**
   * Returns a paginated subset of products.
   *
   * @param {number} [page=1] - Page number (1-indexed)
   * @param {number} [pageSize=20] - Items per page
   * @param {Object} [filters] - Optional filters (category, search, etc.)
   * @returns {Object} { products, total, page, pageSize, totalPages }
   */
  getProductsPaginated(page = 1, pageSize = 20, filters = {}) {
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
  }

  /**
   * Returns products in batches for lazy loading.
   *
   * @param {number} [batchSize=20] - Number of products per batch
   * @returns {Object} { getNextBatch, hasMore, reset }
   */
  createProductIterator(batchSize = 20) {
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
  }

  // =========================================================
  // WHATSAPP & TEMPLATES
  // =========================================================

  /**
   * Sets the WhatsApp phone number for generating links.
   * Strips non-digit characters and validates length (7-15 digits).
   *
   * @param {string|number} number - Phone number (any format)
   * @throws {Error} If number is not a string/number or has invalid length
   * @example
   * whanda.setWhatsAppNumber("+1 809-555-1234");
   */
  setWhatsAppNumber(number) {
    if (typeof number !== "string" && typeof number !== "number") {
      throw new Error(ERR.W026);
    }
    const str = String(number).replace(/[^0-9]/g, "");
    if (str.length < 7 || str.length > 15) {
      throw new Error(ERR.W027);
    }
    this.config.whatsappNumber = str;
  }

  /**
   * Registers a custom WhatsApp message template.
   *
   * @param {string} id - Unique template identifier
   * @param {Function} fn - Template function that receives an order and returns a message string
   * @throws {Error} If id is empty or fn is not a function
   * @example
   * whanda.registerWhatsAppTemplate("minimal", (order) => {
   *   return `Pedido: ${order.total}`;
   * });
   */
  registerWhatsAppTemplate(id, fn) {
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error(ERR.W031);
    }
    if (typeof fn !== "function") {
      throw new Error(ERR.W028);
    }
    this.templates.whatsapp[id] = { id, fn };
  }

  /**
   * Sets the active WhatsApp template by ID.
   *
   * @param {string} id - Template identifier
   * @throws {Error} If template does not exist
   */
  setWhatsAppTemplate(id) {
    if (!this.templates.whatsapp[id]) {
      throw new Error(`${ERR.W029}: "${id}"`);
    }
    this.templates.active = id;
  }

  /**
   * Returns all registered WhatsApp template IDs.
   *
   * @returns {string[]} Array of template IDs
   */
  listWhatsAppTemplates() {
    return Object.keys(this.templates.whatsapp);
  }

  /**
   * Returns a specific WhatsApp template object.
   *
   * @param {string} id - Template identifier
   * @returns {Object|null} Template object { id, fn } or null if not found
   */
  getWhatsAppTemplate(id) {
    return this.templates.whatsapp[id] || null;
  }

  /**
   * Removes a WhatsApp template. Cannot remove the "default" template.
   * If the removed template was active, falls back to "default".
   *
   * @param {string} id - Template identifier
   * @throws {Error} If id is "default" or template not found
   */
  removeWhatsAppTemplate(id) {
    if (id === "default") {
      throw new Error(ERR.W030);
    }
    if (!this.templates.whatsapp[id]) {
      throw new Error(`${ERR.W029}: "${id}"`);
    }
    if (this.templates.active === id) {
      this.templates.active = "default";
    }
    delete this.templates.whatsapp[id];
  }

  /**
   * Renders a specific WhatsApp template with the given order data.
   *
   * @param {string} id - Template identifier
   * @param {Object} order - Order object to pass to the template function
   * @returns {string} Rendered message
   * @throws {Error} If template not found
   */
  previewWhatsAppTemplate(id, order) {
    const template = this.templates.whatsapp[id];
    if (!template) throw new Error(ERR.W029);
    return template.fn(order);
  }

  /**
   * Generates the WhatsApp message using the active template.
   * Runs `beforeGenerateWhatsApp` and `afterGenerateWhatsApp` hooks.
   *
   * @param {Object} order - Order object
   * @returns {Promise<string>} Generated message
   * @throws {Error} If active template not found
   */
  async generateMessage(order) {
    const templateObj = this.templates.whatsapp[this.templates.active];
    if (!templateObj) throw new Error(ERR.W032);

    let message = templateObj.fn(order);

    message = await this.runHooks("beforeGenerateWhatsApp", message);
    message = await this.runHooks("afterGenerateWhatsApp", message);

    return message;
  }

  /**
   * Generates a WhatsApp click-to-chat link with the order message.
   *
   * @param {Object} order - Order object
   * @returns {Promise<string>} WhatsApp URL (https://wa.me/...)
   * @throws {Error} If WhatsApp number is not set
   * @example
   * const link = await whanda.generateLink(order);
   * window.open(link, "_blank");
   */
  async generateLink(order) {
    if (!this.config.whatsappNumber) {
      throw new Error(ERR.W025);
    }
    const message = encodeURIComponent(await this.generateMessage(order));
    return `https://wa.me/${this.config.whatsappNumber}?text=${message}`;
  }

  /**
   * Generates a WhatsApp link after running `beforeWhatsAppSend` hook.
   *
   * @param {Object} order - Order object
   * @returns {Promise<string>} WhatsApp URL
   */
  async sendToWhatsApp(order) {
    await this.runHooks("beforeWhatsAppSend", order);
    return await this.generateLink(order);
  }

  /**
   * Generates a WhatsApp link to share the entire catalog.
   *
   * @param {Object} [options] - Sharing options
   * @param {string} [options.message] - Custom message
   * @param {string} [options.url] - Catalog URL to include
   * @returns {string} WhatsApp share URL
   */
  getShareCatalogUrl(options = {}) {
    const storeName = this.config.storeName || "Mi Tienda";
    const productCount = this.state.products.length;
    const categories = this.getCategories();
    const categoriesText = categories.length > 0 ? `\n📦 Categorías: ${categories.join(", ")}` : "";

    const message = options.message ||
      `🛍️ *${storeName}*\n\nTenemos ${productCount} productos disponibles${categoriesText}\n\n${options.url ? `Ver catálogo: ${options.url}` : ""}`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message.trim())}`;
  }

  /**
   * Returns HTML for a customizable thank-you page after WhatsApp checkout.
   *
   * @param {Object} [options] - Thank you page options
   * @param {string} [options.message="¡Gracias por tu compra!"] - Main message
   * @param {boolean} [options.showOrderSummary=true] - Show order summary
   * @param {string} [options.shareText] - Text for share button
   * @param {string} [options.catalogUrl] - URL to return to catalog
   * @returns {string} HTML string
   */
  getThankYouHtml(options = {}) {
    const {
      message = "¡Gracias por tu compra!",
      showOrderSummary = true,
      shareText = "Compra en nuestra tienda",
      catalogUrl = "#",
    } = options;

    const lastOrder = this.getLastOrder();
    const storeName = this.config.storeName || "Mi Tienda";

    let orderSummary = "";
    if (showOrderSummary && lastOrder) {
      const items = lastOrder.items
        .map((i) => `<li>${this._sanitizeString(i.name)} x${i.quantity} - ${this.formatPrice(i.price * i.quantity)}</li>`)
        .join("");

      orderSummary = `
        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0;">Resumen de tu orden</h3>
          <ul style="margin: 0; padding-left: 20px;">${items}</ul>
          <p style="margin: 10px 0 0 0; font-weight: bold;">
            Total: ${this.formatPrice(lastOrder.total)}
          </p>
        </div>
      `;
    }

    return `
      <div style="text-align: center; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h2 style="color: #28a745;">✓ ${this._sanitizeString(message)}</h2>
        <p style="color: #666;">${this._sanitizeString(storeName)}</p>
        ${orderSummary}
        <div style="margin-top: 30px;">
          <a href="${catalogUrl}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 5px;">
            Volver al catálogo
          </a>
          <a href="${this.getShareCatalogUrl({ message: shareText })}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #25d366; color: white; text-decoration: none; border-radius: 6px; margin: 5px;">
            Compartir con un amigo
          </a>
        </div>
      </div>
    `.trim();
  }

  /**
   * Returns the default WhatsApp message template function.
   * Generates a Spanish-language message with order details and emojis.
   *
   * @returns {Function} Template function: (order) => string
   * @private
   */
  _defaultWhatsAppTemplate() {
    return (order) => {
      const items = order.items
        .map((i) => `- ${i.name} x${i.quantity}`)
        .join("\n");

      const customerInfo = order.customer.name
        ? `\n👤 *Cliente:* ${order.customer.name}\n📍 *Dirección:* ${order.customer.address}`
        : "";

      const taxInfo = order.tax > 0
        ? `\n${order.taxName || "Tax"} (${(order.taxRate * 100).toFixed(0)}%): ${order.tax}`
        : "";

      const currencyInfo = order.currency && order.currency !== "DOP"
        ? `\n💱 Moneda: ${order.currency}`
        : "";

      return `
🛒 *Nuevo Pedido*
${customerInfo}

${items}

Subtotal: ${order.subtotal}
Envío: ${order.shipping}
Descuento: ${order.discount}${taxInfo}${currencyInfo}
Total: *${order.total}*

Pago: ${order.paymentMethod || "N/A"}
Entrega: ${order.deliveryMethod || "N/A"}
      `.trim();
    };
  }
}
