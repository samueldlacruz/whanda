const ERR = {
  W036: "Bundle requires id, name, and products",
  W037: "Bundle not found",
  W038: "Season requires id, name, start, and end",
};

/**
 * Initializes plugin methods on the Whanda prototype.
 * @param {Function} Whanda - The Whanda constructor function.
 */
export function initPlugins(Whanda) {
  // DOWNSELLS

  /**
   * Sets the downsell configuration.
   * @param {Object} config - The downsell configuration.
   */
  Whanda.prototype.setDownsell = function (config) {
    this.state.downsell = config;
  };

  /**
   * Gets the current downsell configuration.
   * @returns {Object|null} A copy of the downsell config or null.
   */
  Whanda.prototype.getDownsell = function () {
    if (!this.state.downsell) return null;
    return { ...this.state.downsell };
  };

  /**
   * Clears the downsell configuration.
   */
  Whanda.prototype.clearDownsell = function () {
    this.state.downsell = null;
  };

  // SEASONS

  /**
   * Creates a new season.
   * @param {Object} config - The season configuration with id, name, start, and end.
   * @throws {Error} W038 if required fields are missing.
   */
  Whanda.prototype.createSeason = function (config) {
    if (!config.id || !config.name || !config.start || !config.end) {
      throw new Error(ERR.W038);
    }
    this.state.seasons.push(config);
  };

  /**
   * Gets all seasons.
   * @returns {Array} A copy of the seasons array.
   */
  Whanda.prototype.getSeasons = function () {
    return [...this.state.seasons];
  };

  /**
   * Gets the currently active season based on the current date.
   * @returns {Object|null} The active season or null.
   */
  Whanda.prototype.getActiveSeason = function () {
    const now = new Date();
    return this.state.seasons.find(
      (s) => now >= new Date(s.start) && now <= new Date(s.end)
    ) || null;
  };

  /**
   * Checks if a product is included in the active season.
   * @param {string} productId - The product ID to check.
   * @returns {boolean} True if the product is in the active season.
   */
  Whanda.prototype.isInSeason = function (productId) {
    const season = this.getActiveSeason();
    if (!season) return false;
    return season.products && season.products.includes(productId);
  };

  /**
   * Removes a season by its ID.
   * @param {string} id - The season ID to remove.
   */
  Whanda.prototype.removeSeason = function (id) {
    this.state.seasons = this.state.seasons.filter((s) => s.id !== id);
  };

  // URGENCY & SCARCITY

  /**
   * Sets urgency configuration for a product.
   * @param {string} productId - The product ID.
   * @param {Object} config - The urgency configuration.
   */
  Whanda.prototype.setProductUrgency = function (productId, config) {
    this.state.urgency[productId] = config;
  };

  /**
   * Gets urgency data for a product with computed fields.
   * @param {string} productId - The product ID.
   * @returns {Object|null} Urgency data or null.
   */
  Whanda.prototype.getUrgency = function (productId) {
    const config = this.state.urgency[productId];
    if (!config) return null;

    const product = this.getProduct(productId);
    const stock = product ? product.stock : null;

    const isUrgent = config.deadline ? new Date() >= new Date(config.deadline) : false;
    const isLowStock = config.lowStock && stock !== null ? stock <= config.lowStock : false;
    const isCountdownActive = config.deadline ? new Date() < new Date(config.deadline) : false;

    let badge = null;
    if (isLowStock) badge = "Low Stock";
    else if (isUrgent) badge = "Selling Fast";

    return {
      ...config,
      isUrgent,
      isLowStock,
      isCountdownActive,
      badge,
    };
  };

  /**
   * Clears urgency data for a product.
   * @param {string} productId - The product ID.
   */
  Whanda.prototype.clearProductUrgency = function (productId) {
    delete this.state.urgency[productId];
  };

  /**
   * Gets all products that are at or below their configured low stock threshold.
   * @returns {Array} Array of product objects with low stock.
   */
  Whanda.prototype.getLowStockProducts = function () {
    return Object.entries(this.state.urgency)
      .filter(([, config]) => config.lowStock)
      .map(([productId, config]) => {
        const product = this.getProduct(productId);
        if (!product) return null;
        if (product.stock <= config.lowStock) return product;
        return null;
      })
      .filter(Boolean);
  };

  // BUNDLES

  /**
   * Creates a new bundle.
   * @param {Object} config - The bundle configuration with id, name, and products.
   * @throws {Error} W036 if required fields are missing.
   */
  Whanda.prototype.createBundle = function (config) {
    if (!config.id || !config.name || !config.products) {
      throw new Error(ERR.W036);
    }

    let originalPrice = 0;
    config.products.forEach((item) => {
      const product = this.getProduct(item.productId);
      if (product) {
        originalPrice += product.price * (item.quantity || 1);
      }
    });

    const bundlePrice = config.discount
      ? originalPrice * (1 - config.discount)
      : originalPrice;

    this.state.bundles.push({
      ...config,
      originalPrice,
      bundlePrice,
    });
  };

  /**
   * Gets all bundles.
   * @returns {Array} A copy of the bundles array.
   */
  Whanda.prototype.getBundles = function () {
    return [...this.state.bundles];
  };

  /**
   * Gets a bundle by its ID.
   * @param {string} id - The bundle ID.
   * @returns {Object|null} The bundle or null.
   */
  Whanda.prototype.getBundle = function (id) {
    return this.state.bundles.find((b) => b.id === id) || null;
  };

  /**
   * Adds a bundle to the cart by adding each product.
   * @param {string} bundleId - The bundle ID.
   * @param {number} [quantity=1] - The quantity of the bundle.
   * @returns {Promise<void>}
   * @throws {Error} W037 if bundle is not found.
   */
  Whanda.prototype.addBundle = async function (bundleId, quantity = 1) {
    const bundle = this.getBundle(bundleId);
    if (!bundle) throw new Error(ERR.W037);

    for (const item of bundle.products) {
      await this.addItem(item.productId, quantity * (item.quantity || 1));
    }
  };

  /**
   * Removes a bundle from the cart by removing each product.
   * @param {string} bundleId - The bundle ID.
   * @throws {Error} W037 if bundle is not found.
   */
  Whanda.prototype.removeBundle = function (bundleId) {
    const bundle = this.getBundle(bundleId);
    if (!bundle) throw new Error(ERR.W037);

    bundle.products.forEach((item) => {
      this.removeCartItem(item.productId);
    });
  };

  /**
   * Deletes a bundle from the state.
   * @param {string} id - The bundle ID to delete.
   */
  Whanda.prototype.deleteBundle = function (id) {
    this.state.bundles = this.state.bundles.filter((b) => b.id !== id);
  };

  // CRO (Conversion Rate Optimization)

  /**
   * Sets CRO configuration by merging into existing state.
   * @param {Object} config - The CRO configuration.
   */
  Whanda.prototype.setCRO = function (config) {
    this.state.cro = { ...this.state.cro, ...config };
  };

  /**
   * Gets all CRO data.
   * @returns {Object} The CRO data including freeShippingProgress, lowStockProducts, recentlyViewed, and exitIntent.
   */
  Whanda.prototype.getCROData = function () {
    return {
      freeShippingProgress: this.checkFreeShippingProgress(),
      lowStockProducts: this.getLowStockProducts(),
      recentlyViewed: this.getRecentlyViewed(),
      exitIntent: this.state.cro.exitIntent || null,
    };
  };

  /**
   * Tracks a product view for recently viewed products.
   * @param {string} productId - The product ID to track.
   */
  Whanda.prototype.trackProductView = function (productId) {
    if (!this.state.recentlyViewed) {
      this.state.recentlyViewed = [];
    }

    this.state.recentlyViewed = this.state.recentlyViewed.filter(
      (id) => id !== productId
    );
    this.state.recentlyViewed.unshift(productId);

    if (this.state.recentlyViewed.length > 10) {
      this.state.recentlyViewed = this.state.recentlyViewed.slice(0, 10);
    }
  };

  /**
   * Gets product objects for recently viewed product IDs.
   * @returns {Array} Array of product objects.
   */
  Whanda.prototype.getRecentlyViewed = function () {
    if (!this.state.recentlyViewed) return [];
    return this.state.recentlyViewed
      .map((id) => this.getProduct(id))
      .filter(Boolean);
  };

  /**
   * Returns simulated social proof data for a product.
   * @param {string} productId - The product ID.
   * @returns {Object} Social proof data.
   */
  Whanda.prototype.getSocialProof = function (productId) {
    const seed = productId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const viewers = (seed % 20) + 5;
    const purchasers = (seed % 15) + 2;

    return {
      productId,
      viewers,
      purchasers,
      message: `${viewers} people are viewing this right now`,
      recentPurchaseMessage: `${purchasers} people bought this recently`,
    };
  };

  /**
   * Checks the free shipping progress based on cart total.
   * @returns {Object} Free shipping progress data.
   */
  Whanda.prototype.checkFreeShippingProgress = function () {
    const threshold = this.state.cro.freeShippingThreshold || 50;
    const cart = this.state.cart || [];
    const total = cart.reduce((sum, item) => {
      const product = this.getProduct(item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    return {
      threshold,
      current: total,
      remaining: Math.max(0, threshold - total),
      qualifies: total >= threshold,
      progress: Math.min(1, total / threshold),
    };
  };
}

export default initPlugins;
