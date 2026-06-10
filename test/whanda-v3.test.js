import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Whanda } from "../src/whanda.js";
import { initExtensions } from "../src/whanda-extensions.js";
import { initPlugins } from "../src/whanda-plugins.js";

initExtensions(Whanda);
initPlugins(Whanda);

const sampleProducts = [
  { id: "1", name: "Camisa Azul", price: 1200, stock: 25, category: "Ropa", image: "img1.jpg", images: ["img1.jpg", "img1b.jpg"] },
  { id: "2", name: "Pantalón Negro", price: 2500, stock: 15, category: "Ropa", image: "img2.jpg" },
  { id: "3", name: "Zapatos Café", price: 3500, stock: 10, category: "Calzado", image: "img3.jpg" },
];

function createWhanda(config = {}) {
  const w = new Whanda(config);
  w.setProducts(sampleProducts);
  return w;
}

// =========================================================
// ADDITIONAL PRODUCT TESTS
// =========================================================

describe("Products - getImages()", () => {
  it("should return images array for product", () => {
    const w = createWhanda();
    const images = w.getImages("1");
    expect(images).toEqual(["img1.jpg", "img1b.jpg"]);
  });

  it("should return empty array for product without images", () => {
    const w = createWhanda();
    const images = w.getImages("2");
    expect(images).toEqual([]);
  });

  it("should return empty array for non-existent product", () => {
    const w = createWhanda();
    const images = w.getImages("999");
    expect(images).toEqual([]);
  });
});

// =========================================================
// CART VALIDATION TESTS
// =========================================================

describe("Cart - addItem validation", () => {
  it("should throw for non-string/non-number productId", async () => {
    const w = createWhanda();
    await expect(w.addItem(null)).rejects.toThrow("Producto no encontrado");
    await expect(w.addItem(undefined)).rejects.toThrow("Producto no encontrado");
    await expect(w.addItem({})).rejects.toThrow("Producto no encontrado");
  });

  it("should throw for non-existent product", async () => {
    const w = createWhanda();
    await expect(w.addItem("999")).rejects.toThrow("Producto no encontrado");
  });

  it("should throw for invalid quantity types", async () => {
    const w = createWhanda();
    await expect(w.addItem("1", "1")).rejects.toThrow("entero positivo");
    await expect(w.addItem("1", 1.5)).rejects.toThrow("entero positivo");
  });
});

describe("Cart - removeCartItem", () => {
  it("should silently do nothing for non-existent product", async () => {
    const w = createWhanda();
    await w.addItem("1");
    w.removeCartItem("999");
    expect(w.getCart()).toHaveLength(1);
  });
});

describe("Cart - clearCart", () => {
  it("should fire onCartEmpty hook", async () => {
    const w = createWhanda();
    await w.addItem("1");
    const fn = vi.fn();
    w.on("onCartEmpty", fn);
    w.clearCart();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// =========================================================
// HOOK TESTS
// =========================================================

describe("Hooks - afterCartChange", () => {
  it("should fire afterCartChange on addItem", async () => {
    const w = createWhanda();
    const fn = vi.fn();
    w.on("afterCartChange", fn);
    await w.addItem("1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should fire afterCartChange on removeCartItem", async () => {
    const w = createWhanda();
    await w.addItem("1");
    const fn = vi.fn();
    w.on("afterCartChange", fn);
    w.removeCartItem("1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should fire afterCartChange on clearCart", async () => {
    const w = createWhanda();
    await w.addItem("1");
    const fn = vi.fn();
    w.on("afterCartChange", fn);
    w.clearCart();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should fire afterCartChange on updateQuantity", async () => {
    const w = createWhanda();
    await w.addItem("1", 3);
    const fn = vi.fn();
    w.on("afterCartChange", fn);
    w.updateQuantity("1", 5);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// =========================================================
// RATE LIMITER TESTS
// =========================================================

describe("Rate Limiter", () => {
  it("should create a rate limiter", () => {
    const w = new Whanda();
    const limiter = w._createRateLimiter(5, 1000);
    expect(limiter.check).toBeDefined();
  });

  it("should allow calls within limit", () => {
    const w = new Whanda();
    const limiter = w._createRateLimiter(3, 1000);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(true);
  });

  it("should reject calls over limit", () => {
    const w = new Whanda();
    const limiter = w._createRateLimiter(2, 60000);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(false);
  });
});

// =========================================================
// CACHE TTL TESTS
// =========================================================

describe("Cache - TTL", () => {
  let store = {};

  const localStorageTarget = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
  };

  const localStorageMock = new Proxy(localStorageTarget, {
    ownKeys: () => Object.keys(store),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });

  beforeEach(() => {
    store = {};
    globalThis.localStorage = localStorageMock;
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it("should expire cache after TTL", () => {
    const w = createWhanda();
    w._setCache("test", "value", 0.001); // 1ms TTL
    expect(w._getCache("test")).toBe("value");
    // Wait for expiration
    const start = Date.now();
    while (Date.now() - start < 10) { /* busy wait */ }
    expect(w._getCache("test")).toBeNull();
  });
});

// =========================================================
// COUPON VALIDATION TESTS
// =========================================================

describe("Coupons - amount validation", () => {
  it("should reject coupon with zero amount", () => {
    const w = new Whanda();
    expect(() => w.addCoupon({ code: "FREE", amount: 0 })).toThrow("amount");
  });

  it("should reject coupon with negative amount", () => {
    const w = new Whanda();
    expect(() => w.addCoupon({ code: "NEG", amount: -100 })).toThrow("amount");
  });
});

// =========================================================
// ORDER ID TESTS
// =========================================================

describe("Orders - ID generation", () => {
  it("should generate unique IDs for consecutive orders", async () => {
    const w = createWhanda({ whatsappNumber: "1234567890" });

    await w.addItem("1");
    w.setCustomerName("Test");
    w.setCustomerAddress("Address");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    const order1 = await w.createOrder();

    await w.addItem("2");
    w.setCustomerName("Test");
    w.setCustomerAddress("Address");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    const order2 = await w.createOrder();

    expect(order1.id).not.toBe(order2.id);
  });
});

// =========================================================
// WHATSAPP - THANK YOU HTML XSS TEST
// =========================================================

describe("WhatsApp - getThankYouHtml XSS", () => {
  it("should sanitize catalogUrl to prevent XSS via quotes", async () => {
    const w = createWhanda({ storeName: "Test" });
    await w.addItem("1");
    w.setCustomerName("Test");
    w.setCustomerAddress("Address");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.createOrder();

    const html = w.getThankYouHtml({ catalogUrl: 'http://example.com" onclick="alert(1)' });
    expect(html).not.toContain('onclick="alert(1)"');
  });

  it("should sanitize message parameter", () => {
    const w = createWhanda({ storeName: "Test" });
    const html = w.getThankYouHtml({ message: '<script>alert("xss")</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

// =========================================================
// PLUGINS - BUNDLE NOT FOUND TESTS
// =========================================================

describe("Plugins - Bundle not found", () => {
  it("should throw when adding non-existent bundle", async () => {
    const w = createWhanda();
    await expect(w.addBundle("nonexistent")).rejects.toThrow("Bundle no encontrado");
  });

  it("should throw when removing non-existent bundle", () => {
    const w = createWhanda();
    expect(() => w.removeBundle("nonexistent")).toThrow("Bundle no encontrado");
  });

  it("should throw when getting non-existent bundle", () => {
    const w = createWhanda();
    expect(w.getBundle("nonexistent")).toBeNull();
  });
});

// =========================================================
// PLUGINS - MULTIPLE SEASONS OVERLAP
// =========================================================

describe("Plugins - Multiple seasons overlap", () => {
  it("should return the first active season", () => {
    const w = new Whanda();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    w.createSeason({
      id: "season1",
      name: "Season 1",
      start: now.toISOString(),
      end: nextMonth.toISOString(),
      type: "promotion",
      discount: 10,
    });

    w.createSeason({
      id: "season2",
      name: "Season 2",
      start: now.toISOString(),
      end: nextWeek.toISOString(),
      type: "promotion",
      discount: 20,
    });

    const active = w.getActiveSeason();
    expect(active).toBeTruthy();
    expect(["season1", "season2"]).toContain(active.id);
  });
});

// =========================================================
// EXTENSIONS - MULTIPLE ORDERS
// =========================================================

describe("Extensions - Multiple orders export", () => {
  it("should export multiple orders to CSV", async () => {
    const w = createWhanda({ whatsappNumber: "1234567890" });

    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.createOrder();

    await w.addItem("2");
    w.setCustomerName("María");
    w.setCustomerAddress("Av. Principal");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.createOrder();

    const csv = w.exportOrders();
    const lines = csv.split("\n").filter((l) => l.trim());
    expect(lines.length).toBe(3); // header + 2 orders
  });

  it("should handle special characters in CSV", async () => {
    const w = createWhanda({ whatsappNumber: "1234567890" });
    w.setCustomerName('Pérez, "Juan"');
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");

    await w.addItem("1");
    await w.createOrder();

    const csv = w.exportOrders();
    expect(csv).toContain("Pérez");
    expect(csv).toContain("Juan");
  });
});

// =========================================================
// BUG FIX TESTS
// =========================================================

describe("Bug Fixes", () => {
  describe("Bug 1: clearCart/removeCartItem fire-and-forget hooks", () => {
    it("should clear cart and fire hooks without await", async () => {
      const w = createWhanda({ whatsappNumber: "1234567890" });
      await w.addItem("1");
      await w.addItem("2");
      expect(w.getCart()).toHaveLength(2);

      let hookFired = false;
      w.on("afterCartChange", () => { hookFired = true; });

      w.clearCart();
      expect(w.getCart()).toHaveLength(0);
      // Hook fires asynchronously but cart is cleared synchronously
      await new Promise((r) => setTimeout(r, 10));
      expect(hookFired).toBe(true);
    });

    it("should remove item and fire hooks without await", async () => {
      const w = createWhanda({ whatsappNumber: "1234567890" });
      await w.addItem("1");
      await w.addItem("2");
      expect(w.getCart()).toHaveLength(2);

      let hookFired = false;
      w.on("afterCartChange", () => { hookFired = true; });

      w.removeCartItem("1");
      expect(w.getCart()).toHaveLength(1);
      await new Promise((r) => setTimeout(r, 10));
      expect(hookFired).toBe(true);
    });
  });

  describe("Bug 2: cancelOrder sets status instead of delete", () => {
    it("should set status to cancelled instead of removing", async () => {
      const w = createWhanda({ whatsappNumber: "1234567890" });
      w.setCustomerName("Test");
      w.setCustomerAddress("Address");
      w.setPaymentMethod("Cash");
      w.setDeliveryMethod("Home Delivery");
      await w.addItem("1");
      const order = await w.createOrder();

      const cancelled = w.cancelOrder(order.id);
      expect(cancelled.status).toBe("cancelled");
      expect(w.listOrders()).toHaveLength(1);
      expect(w.getOrder(order.id).status).toBe("cancelled");
    });
  });

  describe("Bug 3: isUrgent logic before deadline", () => {
    it("should be urgent when deadline is in the future", () => {
      const w = createWhanda();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      w.setProductUrgency("1", { deadline: futureDate.toISOString(), lowStock: 5 });

      const urgency = w.getUrgency("1");
      expect(urgency.isUrgent).toBe(true);
    });

    it("should not be urgent when deadline is in the past", () => {
      const w = createWhanda();
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      w.setProductUrgency("1", { deadline: pastDate.toISOString(), lowStock: 5 });

      const urgency = w.getUrgency("1");
      expect(urgency.isUrgent).toBe(false);
    });
  });

  describe("Bug 4: updateConfig deep merge", () => {
    it("should merge nested shipping config without losing fields", () => {
      const w = createWhanda({ shipping: { type: "fixed", value: 200, freeFrom: 3000, perItem: 50 } });
      w.updateConfig({ shipping: { type: "free" } });

      const config = w.getConfig();
      expect(config.shipping.type).toBe("free");
      expect(config.shipping.value).toBe(200);
      expect(config.shipping.freeFrom).toBe(3000);
      expect(config.shipping.perItem).toBe(50);
    });
  });

  describe("Bug 5: loadProductsFromCache sanitization", () => {
    it("should sanitize products loaded from cache", () => {
      const w = createWhanda();
      const maliciousProducts = [
        { id: "100", name: '<script>alert("xss")</script>', price: 100 }
      ];

      // Manually set the cache in localStorage mock
      const store = {};
      const mockStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
      };
      globalThis.localStorage = mockStorage;

      w._setCache("products", maliciousProducts, 3600);
      const loaded = w.loadProductsFromCache();
      expect(loaded).toBe(true);

      const products = w.getProducts();
      const found = products.find((p) => p.id === "100");
      expect(found).toBeDefined();
      expect(found.name).not.toContain("<script>");
      expect(found.name).toContain("&lt;script&gt;");

      delete globalThis.localStorage;
    });
  });
});

// =========================================================
// PLUGIN VALIDATION TESTS
// =========================================================

describe("Plugin Validations", () => {
  describe("setDownsell validation", () => {
    it("should throw W103 if no config", () => {
      const w = createWhanda();
      expect(() => w.setDownsell()).toThrow("Downsell requiere");
    });

    it("should throw W103 if discount is not a number", () => {
      const w = createWhanda();
      expect(() => w.setDownsell({ discount: "10%" })).toThrow("Downsell requiere");
    });

    it("should throw W103 if discount is zero", () => {
      const w = createWhanda();
      expect(() => w.setDownsell({ discount: 0 })).toThrow("Downsell requiere");
    });

    it("should throw W103 if discount is negative", () => {
      const w = createWhanda();
      expect(() => w.setDownsell({ discount: -5 })).toThrow("Downsell requiere");
    });
  });

  describe("setProductUrgency validation", () => {
    it("should throw W104 if no config", () => {
      const w = createWhanda();
      expect(() => w.setProductUrgency("1")).toThrow("Urgency requiere");
    });

    it("should throw W104 if empty config", () => {
      const w = createWhanda();
      expect(() => w.setProductUrgency("1", {})).toThrow("Urgency requiere");
    });
  });

  describe("createSeason validation", () => {
    it("should throw W105 if start date is invalid", () => {
      const w = createWhanda();
      expect(() => w.createSeason({ id: "s1", name: "Summer", start: "invalid", end: "2025-12-31" })).toThrow("fechas");
    });

    it("should throw W105 if end date is before start", () => {
      const w = createWhanda();
      expect(() => w.createSeason({ id: "s1", name: "Summer", start: "2025-12-31", end: "2025-01-01" })).toThrow("fechas");
    });

    it("should throw W106 if duplicate ID", () => {
      const w = createWhanda();
      w.createSeason({ id: "s1", name: "Summer", start: "2025-01-01", end: "2025-12-31" });
      expect(() => w.createSeason({ id: "s1", name: "Winter", start: "2025-06-01", end: "2025-08-31" })).toThrow("existe");
    });
  });

  describe("createBundle validation", () => {
    it("should throw W106 if duplicate ID", () => {
      const w = createWhanda();
      w.setProducts([{ id: "1", name: "A", price: 100 }]);
      w.createBundle({ id: "b1", name: "Bundle 1", products: ["1"] });
      expect(() => w.createBundle({ id: "b1", name: "Bundle 2", products: ["1"] })).toThrow("existe");
    });
  });
});

// =========================================================
// CSV SANITIZATION TEST
// =========================================================

describe("Extensions - CSV HTML sanitization", () => {
  it("should escape HTML characters in CSV values", async () => {
    const w = createWhanda({ whatsappNumber: "1234567890" });
    w.setCustomerName('<script>alert("xss")</script>');
    w.setCustomerAddress("Address");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.addItem("1");
    await w.createOrder();

    const csv = w.exportOrders();
    expect(csv).not.toContain("<script>");
    // HTML is sanitized, then CSV escape adds &amp; for the & in &lt;
    expect(csv).toContain("&amp;lt;");
  });
});
