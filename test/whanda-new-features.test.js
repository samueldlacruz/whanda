import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Whanda } from "../src/whanda.js";

const sampleProducts = [
  { id: "1", name: "Camisa Azul", price: 1200, stock: 25, category: "Ropa", image: "img1.jpg" },
  { id: "2", name: "Pantalón Negro", price: 2500, stock: 15, category: "Ropa", image: "img2.jpg" },
  { id: "3", name: "Zapatos Café", price: 3500, stock: 10, category: "Calzado", image: "img3.jpg" },
];

function createWhanda(config = {}) {
  const w = new Whanda(config);
  w.setProducts(sampleProducts);
  return w;
}

// =========================================================
// SECURITY
// =========================================================

describe("Security - load()", () => {
  it("should throw on invalid JSON", () => {
    const w = new Whanda();
    expect(() => w.load("invalid json")).toThrow("JSON inválido en load()");
  });

  it("should throw on non-object JSON", () => {
    const w = new Whanda();
    expect(() => w.load('"string"')).toThrow("load() espera un objeto JSON");
  });

  it("should load valid JSON safely", () => {
    const w = new Whanda();
    const data = JSON.stringify({ config: { currency: "USD" } });
    w.load(data);
    expect(w.getConfig().currency).toBe("USD");
  });

  it("should reject unknown config keys", () => {
    const w = new Whanda();
    const data = JSON.stringify({ config: { currency: "USD", evil: "hack" } });
    w.load(data);
    expect(w.getConfig().evil).toBeUndefined();
  });

  it("should reject unknown state keys", () => {
    const w = new Whanda();
    const data = JSON.stringify({ state: { products: [], evil: true } });
    w.load(data);
    expect(w.state.evil).toBeUndefined();
  });
});

describe("Security - sanitizeString()", () => {
  it("should escape HTML entities", () => {
    const w = new Whanda();
    expect(w._sanitizeString('<script>alert("xss")</script>')).not.toContain("<script>");
    expect(w._sanitizeString('<script>alert("xss")</script>')).toContain("&lt;script&gt;");
  });

  it("should escape quotes", () => {
    const w = new Whanda();
    expect(w._sanitizeString('test "quote"')).toContain("&quot;");
  });

  it("should return non-strings as-is", () => {
    const w = new Whanda();
    expect(w._sanitizeString(123)).toBe(123);
    expect(w._sanitizeString(null)).toBeNull();
  });
});

describe("Security - sanitizeObject()", () => {
  it("should sanitize all string properties", () => {
    const w = new Whanda();
    const obj = { name: '<img onerror="alert(1)">', price: 100 };
    const sanitized = w._sanitizeObject(obj);
    expect(sanitized.name).not.toContain("<img");
    expect(sanitized.name).toContain("&lt;img");
    expect(sanitized.price).toBe(100);
  });

  it("should handle nested objects", () => {
    const w = new Whanda();
    const obj = { outer: { inner: '<script>alert(1)</script>' } };
    const sanitized = w._sanitizeObject(obj);
    expect(sanitized.outer.inner).not.toContain("<script>");
    expect(sanitized.outer.inner).toContain("&lt;script&gt;");
  });

  it("should handle arrays", () => {
    const w = new Whanda();
    const arr = ['<script>1</script>', "normal"];
    const sanitized = w._sanitizeObject(arr);
    expect(sanitized[0]).not.toContain("<script>");
    expect(sanitized[0]).toContain("&lt;script&gt;");
    expect(sanitized[1]).toBe("normal");
  });
});

// =========================================================
// MULTI-CURRENCY
// =========================================================

describe("Multi-Currency", () => {
  it("should have default currency", () => {
    const w = new Whanda();
    expect(w.getCurrency()).toBe("DOP");
  });

  it("should set currency", () => {
    const w = new Whanda({ currencies: { USD: 1, DOP: 56.5 } });
    w.setCurrency("USD");
    expect(w.getCurrency()).toBe("USD");
  });

  it("should throw on unsupported currency", () => {
    const w = new Whanda({ currencies: { USD: 1 } });
    expect(() => w.setCurrency("EUR")).toThrow("Moneda no soportada");
  });

  it("should allow any currency when no currencies config", () => {
    const w = new Whanda();
    w.setCurrency("EUR");
    expect(w.getCurrency()).toBe("EUR");
  });

  it("should get exchange rate", () => {
    const w = new Whanda({ currencies: { USD: 1, DOP: 56.5 } });
    expect(w.getExchangeRate("DOP")).toBe(56.5);
    expect(w.getExchangeRate("USD")).toBe(1);
  });

  it("should return 1 for unknown currency", () => {
    const w = new Whanda();
    expect(w.getExchangeRate("XYZ")).toBe(1);
  });

  it("should convert price", () => {
    const w = new Whanda({ currencies: { USD: 1, DOP: 56.5 } });
    w.setCurrency("DOP");
    expect(w.convertPrice(100)).toBe(5650);
  });

  it("should format price with currency", () => {
    const w = new Whanda({ locale: "en-US", currency: "USD" });
    const formatted = w.formatPrice(100);
    expect(formatted).toContain("$");
    expect(formatted).toContain("100");
  });

  it("should format price with custom currency", () => {
    const w = new Whanda({ locale: "en-US" });
    const formatted = w.formatPrice(100, "USD");
    expect(formatted).toContain("100");
  });
});

// =========================================================
// MULTI-REGION
// =========================================================

describe("Multi-Region", () => {
  it("should have default region as null", () => {
    const w = new Whanda();
    expect(w.getRegion()).toBeNull();
  });

  it("should set region", () => {
    const w = new Whanda({
      regions: { DO: { tax: 0.18, currency: "DOP" } },
    });
    w.setRegion("DO");
    expect(w.getRegion()).toBe("DO");
  });

  it("should throw on unsupported region", () => {
    const w = new Whanda({ regions: { DO: {} } });
    expect(() => w.setRegion("US")).toThrow("Región no soportada");
  });

  it("should auto-set currency when setting region", () => {
    const w = new Whanda({
      regions: { DO: { tax: 0.18, currency: "DOP" } },
    });
    w.setRegion("DO");
    expect(w.getCurrency()).toBe("DOP");
  });

  it("should get tax rate", () => {
    const w = new Whanda({
      regions: { DO: { tax: 0.18 } },
    });
    w.setRegion("DO");
    expect(w.getTax()).toBe(0.18);
  });

  it("should get tax from object config", () => {
    const w = new Whanda({
      regions: { DO: { tax: { rate: 0.18, name: "ITBIS" } } },
    });
    w.setRegion("DO");
    expect(w.getTax()).toBe(0.18);
    expect(w.getTaxName()).toBe("ITBIS");
  });

  it("should return 0 tax when no region", () => {
    const w = new Whanda();
    expect(w.getTax()).toBe(0);
  });

  it("should get regional shipping cost", () => {
    const w = new Whanda({
      regions: { DO: { shipping: { flat: 150 } } },
    });
    w.setRegion("DO");
    expect(w.getRegionalShippingCost()).toBe(150);
  });

  it("should get free shipping over threshold", async () => {
    const w = new Whanda({
      regions: { DO: { shipping: { flat: 150, freeFrom: 2000 } } },
    });
    w.setRegion("DO");
    w.setProducts([{ id: "1", price: 2500, stock: 10 }]);
    await w.addItem("1");
    expect(w.getRegionalShippingCost()).toBe(0);
  });

  it("should include tax in getTotal()", async () => {
    const w = new Whanda({
      regions: { DO: { tax: 0.18 } },
    });
    w.setRegion("DO");
    w.setProducts([{ id: "1", price: 1000, stock: 10 }]);
    await w.addItem("1");
    const total = w.getTotal();
    // 1000 * 1.18 = 1180
    expect(total).toBe(1180);
  });

  it("should include tax in calculate()", async () => {
    const w = new Whanda({
      regions: { DO: { tax: 0.18 } },
    });
    w.setRegion("DO");
    w.setProducts([{ id: "1", price: 1000, stock: 10 }]);
    await w.addItem("1");
    const calc = w.calculate();
    expect(calc.tax).toBe(180);
    expect(calc.taxRate).toBe(0.18);
  });

  it("should include tax and currency in order", async () => {
    const w = new Whanda({
      currencies: { USD: 1, DOP: 56.5 },
      regions: { DO: { tax: 0.18, currency: "DOP" } },
      whatsappNumber: "18095551234",
    });
    w.setRegion("DO");
    w.setProducts([{ id: "1", price: 1000, stock: 10 }]);
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Santo Domingo");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");

    const order = await w.createOrder();
    expect(order.tax).toBe(180);
    expect(order.taxRate).toBe(0.18);
    expect(order.currency).toBe("DOP");
    expect(order.region).toBe("DO");
  });
});

// =========================================================
// WHATSAPP ENHANCED
// =========================================================

describe("WhatsApp Enhanced", () => {
  it("should generate share catalog URL", () => {
    const w = createWhanda({ storeName: "Mi Tienda" });
    const url = w.getShareCatalogUrl();
    expect(url).toContain("api.whatsapp.com/send");
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("Mi Tienda");
    expect(decoded).toContain("3 productos");
  });

  it("should generate share URL with custom message", () => {
    const w = createWhanda();
    const url = w.getShareCatalogUrl({ message: "Custom message" });
    expect(url).toContain(encodeURIComponent("Custom message"));
  });

  it("should generate share URL with catalog link", () => {
    const w = createWhanda();
    const url = w.getShareCatalogUrl({ url: "https://mitienda.com" });
    expect(url).toContain(encodeURIComponent("https://mitienda.com"));
  });

  it("should generate thank you HTML", () => {
    const w = createWhanda({ storeName: "Mi Tienda" });
    const html = w.getThankYouHtml({ message: "Gracias por comprar" });
    expect(html).toContain("Gracias por comprar");
    expect(html).toContain("Mi Tienda");
  });

  it("should include order summary in thank you page", async () => {
    const w = createWhanda({ storeName: "Mi Tienda" });
    w.setCustomerName("Juan");
    w.setCustomerAddress("Santo Domingo");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.addItem("1");

    await w.createOrder();

    const html = w.getThankYouHtml();
    expect(html).toContain("Resumen de tu orden");
    expect(html).toContain("Camisa Azul");
  });

  it("should include tax in default template", async () => {
    const w = createWhanda({
      regions: { DO: { tax: { rate: 0.18, name: "ITBIS" } } },
      whatsappNumber: "18095551234",
    });
    w.setRegion("DO");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Santo Domingo");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.addItem("1");

    const order = await w.createOrder();
    const message = await w.generateMessage(order);
    expect(message).toContain("ITBIS");
    expect(message).toContain("18%");
  });
});

// =========================================================
// SCALABILITY - PAGINATION
// =========================================================

describe("Pagination", () => {
  it("should return paginated products", () => {
    const products = Array.from({ length: 50 }, (_, i) => ({
      id: String(i + 1),
      name: `Product ${i + 1}`,
      price: 100,
      stock: 10,
    }));
    const w = new Whanda();
    w.setProducts(products);

    const page1 = w.getProductsPaginated(1, 10);
    expect(page1.products).toHaveLength(10);
    expect(page1.total).toBe(50);
    expect(page1.totalPages).toBe(5);
    expect(page1.hasNext).toBe(true);
    expect(page1.hasPrev).toBe(false);
  });

  it("should return last page correctly", () => {
    const products = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      name: `Product ${i + 1}`,
      price: 100,
      stock: 10,
    }));
    const w = new Whanda();
    w.setProducts(products);

    const page3 = w.getProductsPaginated(3, 10);
    expect(page3.products).toHaveLength(5);
    expect(page3.hasNext).toBe(false);
    expect(page3.hasPrev).toBe(true);
  });

  it("should create product iterator", () => {
    const products = Array.from({ length: 30 }, (_, i) => ({
      id: String(i + 1),
      name: `Product ${i + 1}`,
      price: 100,
      stock: 10,
    }));
    const w = new Whanda();
    w.setProducts(products);

    const iterator = w.createProductIterator(10);
    expect(iterator.hasMore()).toBe(true);
    expect(iterator.getTotal()).toBe(30);
    expect(iterator.getLoaded()).toBe(0);

    const batch1 = iterator.getNextBatch();
    expect(batch1).toHaveLength(10);
    expect(iterator.getLoaded()).toBe(10);

    const batch2 = iterator.getNextBatch();
    expect(batch2).toHaveLength(10);

    const batch3 = iterator.getNextBatch();
    expect(batch3).toHaveLength(10);
    expect(iterator.hasMore()).toBe(false);
  });

  it("should reset iterator", () => {
    const products = Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      name: `Product ${i + 1}`,
      price: 100,
      stock: 10,
    }));
    const w = new Whanda();
    w.setProducts(products);

    const iterator = w.createProductIterator(10);
    iterator.getNextBatch();
    expect(iterator.getLoaded()).toBe(10);

    iterator.reset();
    expect(iterator.getLoaded()).toBe(0);
    expect(iterator.hasMore()).toBe(true);
  });
});

// =========================================================
// CACHE
// =========================================================

describe("Cache", () => {
  let store = {};

  // Use Proxy to make Object.keys work on localStorage mock
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

  it("should cache and load products", () => {
    const w = createWhanda();
    w.cacheProducts();
    expect(localStorage.getItem("whanda_products")).toBeTruthy();

    const w2 = new Whanda();
    const loaded = w2.loadProductsFromCache();
    expect(loaded).toBe(true);
    expect(w2.state.products).toHaveLength(3);
  });

  it("should return false when no cache", () => {
    const w = new Whanda();
    const loaded = w.loadProductsFromCache();
    expect(loaded).toBe(false);
  });

  it("should clear specific cache key", () => {
    const w = createWhanda();
    w._setCache("test", "value");
    expect(w._getCache("test")).toBe("value");

    w._clearCache("test");
    expect(w._getCache("test")).toBeNull();
  });

  it("should clear all cache", () => {
    const w = createWhanda();
    w._setCache("test1", "value1");
    w._setCache("test2", "value2");
    expect(w._getCache("test1")).toBe("value1");

    w._clearCache();
    expect(w._getCache("test1")).toBeNull();
    expect(w._getCache("test2")).toBeNull();
  });
});
