// ================================
// WHANDA CORE FRAMEWORK
// Headless Catalog + WhatsApp Checkout
// ================================

export class Whanda {
  constructor(config = {}) {
    this.config = {
      currency: "DOP",
      locale: "es-DO",
      whatsappNumber: null,
      shipping: { type: "fixed", value: 0, freeFrom: null, perItem: 0 },
      paymentMethods: ["Cash", "Bank Transfer"],
      deliveryMethods: ["Home Delivery", "In-store Pickup"],
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
    };

    this.templates = {
      whatsapp: {
        default: { id: "default", fn: this._defaultWhatsAppTemplate() },
      },
      active: "default",
    };
  }

  // =========================================================
  // CONFIGURATION
  // =========================================================

  getConfig() {
    return { ...this.config };
  }

  updateConfig(partialConfig) {
    this.config = { ...this.config, ...partialConfig };
  }

  // =========================================================
  // HOOK SYSTEM
  // =========================================================

  on(hook, fn) {
    if (!this.hooks[hook]) {
      console.warn(`Whanda: unknown hook "${hook}"`);
      return;
    }
    this.hooks[hook].push(fn);
  }

  off(hook, fn) {
    if (!this.hooks[hook]) return;
    this.hooks[hook] = this.hooks[hook].filter((f) => f !== fn);
  }

  async runHooks(hook, payload) {
    if (!this.hooks[hook]) return payload;
    let result = payload;
    for (const fn of this.hooks[hook]) {
      try {
        const res = await fn(result);
        if (res !== undefined && res !== null) result = res;
        if (res && typeof res === "object" && res.abort === true) {
          throw new Error(res.message || `Hook "${hook}" aborted`);
        }
      } catch (err) {
        if (err.message && err.message.includes("aborted")) throw err;
        console.error(`Whanda: hook "${hook}" error:`, err);
      }
    }
    return result;
  }

  // =========================================================
  // PRODUCTS
  // =========================================================

  setProducts(products) {
    if (!Array.isArray(products)) {
      throw new Error("setProducts() requires an array");
    }
    this.state.products = products;
  }

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

  getProduct(id) {
    return this.state.products.find((p) => p.id === id) || null;
  }

  getPrice(id) {
    const product = this.getProduct(id);
    return product ? product.price : 0;
  }

  getStock(id) {
    const product = this.getProduct(id);
    return product ? product.stock || 0 : 0;
  }

  getImages(id) {
    const product = this.getProduct(id);
    return product ? product.images || [] : [];
  }

  getCategory(id) {
    const product = this.getProduct(id);
    return product ? product.category || null : null;
  }

  getCategories() {
    return [
      ...new Set(
        this.state.products
          .map((p) => p.category)
          .filter((c) => c != null && c !== "")
      ),
    ];
  }

  search(query) {
    if (typeof query !== "string") {
      throw new Error("search() requires a string");
    }
    const q = query.toLowerCase();
    return this.state.products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }

  filterByCategory(category) {
    return this.state.products.filter((p) => p.category === category);
  }

  getRelatedProducts(productId) {
    const product = this.getProduct(productId);
    if (!product) return [];

    if (product.relatedIds && Array.isArray(product.relatedIds)) {
      return product.relatedIds
        .map((id) => this.getProduct(id))
        .filter((p) => p !== null);
    }

    return this.filterByCategory(product.category).filter(
      (p) => p.id !== productId
    );
  }

  getRelated(id) {
    return this.getRelatedProducts(id);
  }

  // =========================================================
  // RECOMMENDATIONS
  // =========================================================

  getRecommendations(productId) {
    return this.getRelatedProducts(productId);
  }

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

  getUpsells(productId) {
    const product = this.getProduct(productId);
    if (!product) return [];
    if (product.upsellIds && Array.isArray(product.upsellIds)) {
      return product.upsellIds
        .map((id) => this.getProduct(id))
        .filter((p) => p !== null && p.price > product.price);
    }
    return this.filterByCategory(product.category).filter(
      (p) => p.price > product.price && p.id !== productId
    );
  }

  getCrossSells(productId) {
    const product = this.getProduct(productId);
    if (!product) return [];
    if (product.crossSellIds && Array.isArray(product.crossSellIds)) {
      return product.crossSellIds
        .map((id) => this.getProduct(id))
        .filter((p) => p !== null);
    }
    return this.getRelatedProducts(productId);
  }

  // =========================================================
  // CART
  // =========================================================

  getCart() {
    return [...this.state.cart];
  }

  getCartItems() {
    return [...this.state.cart];
  }

  async addItem(productId, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("quantity must be a positive integer");
    }

    await this.runHooks("beforeAddToCart", { productId, quantity });
    const product = this.getProduct(productId);
    if (!product) throw new Error("Product not found");

    if (product.stock != null && product.stock < quantity) {
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
    }

    const existing = this.state.cart.find((i) => i.productId === productId);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock != null && product.stock < newQty) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${existing.quantity}`
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

  clearCart() {
    this.state.cart = [];
    this.runHooks("afterCartChange", this.state.cart);
  }

  removeCartItem(productId) {
    this.state.cart = this.state.cart.filter(
      (item) => item.productId !== productId
    );
    this.runHooks("afterCartChange", this.state.cart);
  }

  updateQuantity(productId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error("quantity must be a non-negative integer");
    }

    const item = this.state.cart.find((i) => i.productId === productId);
    if (!item) throw new Error("Product not found in cart");

    if (quantity === 0) {
      this.removeCartItem(productId);
    } else {
      const product = this.getProduct(productId);
      if (product && product.stock != null && product.stock < quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`
        );
      }
      item.quantity = quantity;
      this.runHooks("afterCartChange", this.state.cart);
    }
  }

  hasCartItem(productId) {
    return this.state.cart.some((item) => item.productId === productId);
  }

  getCartItemCount() {
    return this.state.cart.reduce((count, item) => count + item.quantity, 0);
  }

  // =========================================================
  // PRICING
  // =========================================================

  getSubtotal() {
    return this.state.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  getShippingCost() {
    const subtotal = this.getSubtotal();
    if (this.config.shipping.freeFrom != null && subtotal >= this.config.shipping.freeFrom) {
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

  getTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingCost();
    const total = subtotal - discount + shipping;
    return Math.max(0, total);
  }

  calculate() {
    return {
      subtotal: this.getSubtotal(),
      shipping: this.getShippingCost(),
      discount: this.getDiscountAmount(),
      total: this.getTotal(),
    };
  }

  formatPrice(amount) {
    return new Intl.NumberFormat(this.config.locale, {
      style: "currency",
      currency: this.config.currency,
    }).format(amount);
  }

  // =========================================================
  // DISCOUNTS / COUPONS
  // =========================================================

  addCoupon(coupon) {
    if (!coupon || typeof coupon.code !== "string" || coupon.code.trim() === "") {
      throw new Error("Coupon must have a valid 'code' string");
    }
    if (coupon.amount == null || typeof coupon.amount !== "number" || coupon.amount < 0) {
      throw new Error("Coupon must have a valid 'amount' number");
    }
    this.state.coupons.push(coupon);
  }

  getCoupons() {
    return [...this.state.coupons];
  }

  validateCoupon(code) {
    if (typeof code !== "string") return false;
    return this.state.coupons.some((c) => c.code === code);
  }

  applyCoupon(code) {
    if (typeof code !== "string") {
      throw new Error("Coupon code must be a string");
    }

    const coupon = this.state.coupons.find((c) => c.code === code);
    if (!coupon) throw new Error("Invalid coupon code");

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new Error("Coupon has expired");
    }

    if (coupon.maxUses != null && (coupon.usedCount || 0) >= coupon.maxUses) {
      throw new Error("Coupon usage limit reached");
    }

    if (coupon.minOrder != null && this.getSubtotal() < coupon.minOrder) {
      throw new Error(`Minimum order amount for this coupon is ${coupon.minOrder}`);
    }

    this.state.coupon = coupon;
  }

  removeCoupon() {
    this.state.coupon = null;
  }

  getActiveCoupon() {
    return this.state.coupon ? { ...this.state.coupon } : null;
  }

  // =========================================================
  // SHIPPING
  // =========================================================

  getShippingMethods() {
    return ["fixed", "free", "per_item"];
  }

  setShippingMethod(method) {
    if (!this.getShippingMethods().includes(method)) {
      throw new Error("Invalid shipping method");
    }
    this.config.shipping.type = method;
  }

  isFreeShipping() {
    return this.getShippingCost() === 0;
  }

  getFreeShippingMin() {
    return this.config.shipping.freeFrom;
  }

  setFixedShipping(value) {
    if (typeof value !== "number" || value < 0) {
      throw new Error("Shipping value must be a non-negative number");
    }
    this.config.shipping.type = "fixed";
    this.config.shipping.value = value;
  }

  setFreeShippingFrom(threshold) {
    if (typeof threshold !== "number" || threshold <= 0) {
      throw new Error("Free shipping threshold must be a positive number");
    }
    this.config.shipping.freeFrom = threshold;
  }

  setPerItemShipping(value) {
    if (typeof value !== "number" || value < 0) {
      throw new Error("Per-item shipping value must be a non-negative number");
    }
    this.config.shipping.type = "per_item";
    this.config.shipping.perItem = value;
  }

  // =========================================================
  // CUSTOMER
  // =========================================================

  setCustomerName(name) {
    this.state.customer.name = name;
  }

  setCustomerAddress(address) {
    this.state.customer.address = address;
  }

  setCustomerNotes(notes) {
    this.state.customer.notes = notes;
  }

  getCustomer() {
    return { ...this.state.customer };
  }

  // =========================================================
  // CHECKOUT
  // =========================================================

  getPaymentMethods() {
    return [...this.config.paymentMethods];
  }

  setPaymentMethod(method) {
    if (!this.getPaymentMethods().includes(method)) {
      throw new Error("Invalid payment method");
    }
    this.state.checkout.paymentMethod = method;
  }

  getDeliveryMethods() {
    return [...this.config.deliveryMethods];
  }

  setDeliveryMethod(method) {
    if (!this.getDeliveryMethods().includes(method)) {
      throw new Error("Invalid delivery method");
    }
    this.state.checkout.deliveryMethod = method;
  }

  validateCheckout() {
    if (this.state.cart.length === 0) throw new Error("Cart is empty");
    if (!this.state.customer.name) throw new Error("Customer name is required");
    if (!this.state.customer.address)
      throw new Error("Customer address is required");
    if (!this.state.checkout.paymentMethod)
      throw new Error("Payment method is required");
    if (!this.state.checkout.deliveryMethod)
      throw new Error("Delivery method is required");
    return true;
  }

  preview() {
    const pricing = this.calculate();
    return {
      items: this.getCartItems(),
      customer: this.getCustomer(),
      paymentMethod: this.state.checkout.paymentMethod,
      deliveryMethod: this.state.checkout.deliveryMethod,
      ...pricing,
    };
  }

  async createOrder(meta = {}) {
    this.validateCheckout();
    await this.runHooks("beforeCheckout", meta);

    const order = {
      id: Date.now(),
      items: structuredClone(this.state.cart),
      subtotal: this.getSubtotal(),
      shipping: this.getShippingCost(),
      discount: this.getDiscountAmount(),
      total: this.getTotal(),
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

  getOrder(id) {
    return this.state.orders.find((o) => o.id === id) || null;
  }

  getLastOrder() {
    return this.state.orders[this.state.orders.length - 1] || null;
  }

  listOrders() {
    return [...this.state.orders];
  }

  updateOrderStatus(id, status) {
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
    const order = this.state.orders.find((o) => o.id === id);
    if (!order) throw new Error("Order not found");
    order.status = status;
    return order;
  }

  cancelOrder(id) {
    const index = this.state.orders.findIndex((o) => o.id === id);
    if (index === -1) throw new Error("Order not found");
    const order = this.state.orders.splice(index, 1)[0];
    return order;
  }

  exportOrders() {
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
  }

  // =========================================================
  // PERSISTENCE
  // =========================================================

  save() {
    return JSON.stringify({
      config: this.config,
      state: this.state,
      templates: {
        active: this.templates.active,
      },
    });
  }

  load(jsonString) {
    const data = JSON.parse(jsonString);
    if (data.config) this.config = { ...this.config, ...data.config };
    if (data.state) this.state = { ...this.state, ...data.state };
    if (data.templates && data.templates.active) {
      this.templates.active = data.templates.active;
    }
  }

  reset() {
    this.state.cart = [];
    this.state.coupon = null;
    this.state.customer = { name: null, address: null, notes: null };
    this.state.checkout = { paymentMethod: null, deliveryMethod: null };
  }

  // =========================================================
  // SYNC
  // =========================================================

  async sync(data) {
    let payload = await this.runHooks("beforeSync", data);
    const result = payload;
    await this.runHooks("afterSync", result);
    return result;
  }

  // =========================================================
  // WHATSAPP & TEMPLATES
  // =========================================================

  setWhatsAppNumber(number) {
    if (typeof number !== "string" && typeof number !== "number") {
      throw new Error("WhatsApp number must be a string or number");
    }
    const str = String(number).replace(/[^0-9]/g, "");
    if (str.length < 7 || str.length > 15) {
      throw new Error("WhatsApp number must be between 7 and 15 digits");
    }
    this.config.whatsappNumber = str;
  }

  registerWhatsAppTemplate(id, fn) {
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error("Template id must be a non-empty string");
    }
    if (typeof fn !== "function") {
      throw new Error("Template must be a function");
    }
    this.templates.whatsapp[id] = { id, fn };
  }

  setWhatsAppTemplate(id) {
    if (!this.templates.whatsapp[id]) {
      throw new Error(`Template "${id}" not found`);
    }
    this.templates.active = id;
  }

  listWhatsAppTemplates() {
    return Object.keys(this.templates.whatsapp);
  }

  getWhatsAppTemplate(id) {
    return this.templates.whatsapp[id] || null;
  }

  removeWhatsAppTemplate(id) {
    if (id === "default") {
      throw new Error("Cannot remove the default template");
    }
    if (!this.templates.whatsapp[id]) {
      throw new Error(`Template "${id}" not found`);
    }
    if (this.templates.active === id) {
      this.templates.active = "default";
    }
    delete this.templates.whatsapp[id];
  }

  previewWhatsAppTemplate(id, order) {
    const template = this.templates.whatsapp[id];
    if (!template) throw new Error("Template not found");
    return template.fn(order);
  }

  async generateMessage(order) {
    const templateObj = this.templates.whatsapp[this.templates.active];
    if (!templateObj) throw new Error("Active template not found");

    let message = templateObj.fn(order);

    message = await this.runHooks("beforeGenerateWhatsApp", message);
    message = await this.runHooks("afterGenerateWhatsApp", message);

    return message;
  }

  async generateLink(order) {
    if (!this.config.whatsappNumber) {
      throw new Error("WhatsApp number not set");
    }
    const message = encodeURIComponent(await this.generateMessage(order));
    return `https://wa.me/${this.config.whatsappNumber}?text=${message}`;
  }

  async whatsappOpen(order) {
    return await this.generateLink(order);
  }

  async whatsappPreview(order) {
    return await this.generateMessage(order);
  }

  async sendToWhatsApp(order) {
    await this.runHooks("beforeWhatsAppSend", order);
    return await this.generateLink(order);
  }

  _defaultWhatsAppTemplate() {
    return (order) => {
      const items = order.items
        .map((i) => `- ${i.name} x${i.quantity}`)
        .join("\n");

      const customerInfo = order.customer.name
        ? `\n👤 *Cliente:* ${order.customer.name}\n📍 *Dirección:* ${order.customer.address}`
        : "";

      return `
🛒 *Nuevo Pedido*
${customerInfo}

${items}

Subtotal: ${order.subtotal}
Envío: ${order.shipping}
Descuento: ${order.discount}
Total: *${order.total}*

Pago: ${order.paymentMethod || "N/A"}
Entrega: ${order.deliveryMethod || "N/A"}
      `.trim();
    };
  }
}
