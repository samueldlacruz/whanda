import { describe, it, expect, beforeEach, vi } from "vitest";
import { Whanda } from "../src/whanda.js";

const sampleProducts = [
  { id: "1", name: "Camisa Azul", price: 1200, stock: 25, category: "Ropa", image: "img1.jpg" },
  { id: "2", name: "Pantalón Negro", price: 2500, stock: 15, category: "Ropa", image: "img2.jpg" },
  { id: "3", name: "Zapatos Café", price: 3500, stock: 10, category: "Calzado", image: "img3.jpg" },
  { id: "4", name: "Gorra Roja", price: 800, stock: 0, category: "Accesorios", image: "img4.jpg" },
  { id: "5", name: "Camisa Verde", price: 1500, stock: 20, category: "Ropa", image: "img5.jpg",
    relatedIds: ["1", "2"], upsellIds: ["3"], crossSellIds: ["4"] },
];

function createWhanda() {
  const w = new Whanda();
  w.setProducts(sampleProducts);
  return w;
}

// =========================================================
// CONFIGURACIÓN
// =========================================================

describe("Configuration", () => {
  it("should have default config", () => {
    const w = new Whanda();
    const config = w.getConfig();
    expect(config.currency).toBe("DOP");
    expect(config.locale).toBe("es-DO");
    expect(config.whatsappNumber).toBeNull();
    expect(config.shipping.type).toBe("fixed");
    expect(config.shipping.value).toBe(0);
    expect(config.shipping.freeFrom).toBeNull();
    expect(config.paymentMethods).toEqual(["Cash", "Bank Transfer"]);
    expect(config.deliveryMethods).toEqual(["Home Delivery", "In-store Pickup"]);
  });

  it("should accept custom config in constructor", () => {
    const w = new Whanda({ currency: "USD", locale: "en-US" });
    expect(w.getConfig().currency).toBe("USD");
    expect(w.getConfig().locale).toBe("en-US");
  });

  it("should update config with updateConfig()", () => {
    const w = new Whanda();
    w.updateConfig({ currency: "EUR" });
    expect(w.getConfig().currency).toBe("EUR");
    expect(w.getConfig().locale).toBe("es-DO");
  });

  it("should return a copy of config (not reference)", () => {
    const w = new Whanda();
    const config = w.getConfig();
    config.currency = "EUR";
    expect(w.getConfig().currency).toBe("DOP");
  });
});

// =========================================================
// HOOK SYSTEM
// =========================================================

describe("Hook System", () => {
  it("should register a hook with on()", () => {
    const w = new Whanda();
    const fn = vi.fn();
    w.on("beforeAddToCart", fn);
    expect(w.hooks.beforeAddToCart).toContain(fn);
  });

  it("should warn on unknown hook name", () => {
    const w = new Whanda();
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    w.on("unknownHook", () => {});
    expect(spy).toHaveBeenCalledWith('Whanda: unknown hook "unknownHook"');
    spy.mockRestore();
  });

  it("should remove a hook with off()", () => {
    const w = new Whanda();
    const fn = vi.fn();
    w.on("beforeAddToCart", fn);
    w.off("beforeAddToCart", fn);
    expect(w.hooks.beforeAddToCart).not.toContain(fn);
  });

  it("should run hooks and return payload", async () => {
    const w = new Whanda();
    const fn = (payload) => ({ ...payload, extra: true });
    w.on("beforeAddToCart", fn);
    const result = await w.runHooks("beforeAddToCart", { productId: "1", quantity: 1 });
    expect(result.extra).toBe(true);
  });

  it("should abort if hook returns { abort: true }", async () => {
    const w = new Whanda();
    w.on("beforeAddToCart", () => ({ abort: true, message: "Stop!" }));
    await expect(
      w.runHooks("beforeAddToCart", { productId: "1", quantity: 1 })
    ).rejects.toThrow("Stop!");
  });

  it("should catch hook errors and continue", async () => {
    const w = new Whanda();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    w.on("afterAddToCart", () => { throw new Error("hook error"); });
    const result = await w.runHooks("afterAddToCart", "test");
    expect(result).toBe("test");
    spy.mockRestore();
  });

  it("should return payload if no hooks registered", async () => {
    const w = new Whanda();
    const result = await w.runHooks("beforeAddToCart", "test");
    expect(result).toBe("test");
  });

  it("should not replace result with null from hook", async () => {
    const w = new Whanda();
    w.on("beforeAddToCart", () => null);
    const result = await w.runHooks("beforeAddToCart", "original");
    expect(result).toBe("original");
  });

  it("should fire onRemoveItem hook when removing item", async () => {
    const w = new Whanda();
    w.setProducts([{ id: "1", name: "Test", price: 100, stock: 10, category: "Cat" }]);
    const fn = vi.fn();
    w.on("onRemoveItem", fn);
    await w.addItem("1");
    w.removeCartItem("1");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ productId: "1" }));
  });

  it("should fire onCartEmpty hook when clearing cart", async () => {
    const w = new Whanda();
    w.setProducts([{ id: "1", name: "Test", price: 100, stock: 10, category: "Cat" }]);
    const fn = vi.fn();
    w.on("onCartEmpty", fn);
    await w.addItem("1");
    w.clearCart();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ cart: expect.any(Array) }));
  });
});

// =========================================================
// PRODUCTS
// =========================================================

describe("Products", () => {
  it("should set and get products", () => {
    const w = new Whanda();
    w.setProducts(sampleProducts);
    expect(w.getProducts()).toHaveLength(5);
  });

  it("should throw if setProducts receives non-array", () => {
    const w = new Whanda();
    expect(() => w.setProducts("not array")).toThrow("setProducts() requiere un arreglo");
  });

  it("should get product by id", () => {
    const w = createWhanda();
    expect(w.getProduct("1").name).toBe("Camisa Azul");
  });

  it("should return null for non-existent product", () => {
    const w = createWhanda();
    expect(w.getProduct("999")).toBeNull();
  });

  it("should get price", () => {
    const w = createWhanda();
    expect(w.getPrice("1")).toBe(1200);
  });

  it("should return 0 for non-existent product price", () => {
    const w = createWhanda();
    expect(w.getPrice("999")).toBe(0);
  });

  it("should get stock", () => {
    const w = createWhanda();
    expect(w.getStock("1")).toBe(25);
  });

  it("should get category", () => {
    const w = createWhanda();
    expect(w.getCategory("1")).toBe("Ropa");
  });

  it("should get unique categories", () => {
    const w = createWhanda();
    const cats = w.getCategories();
    expect(cats).toContain("Ropa");
    expect(cats).toContain("Calzado");
    expect(cats).toContain("Accesorios");
    expect(cats.length).toBe(3);
  });

  it("should search products by name", () => {
    const w = createWhanda();
    expect(w.search("camisa")).toHaveLength(2);
  });

  it("should search products by category", () => {
    const w = createWhanda();
    expect(w.search("calzado")).toHaveLength(1);
  });

  it("should throw if search receives non-string", () => {
    const w = createWhanda();
    expect(() => w.search(123)).toThrow("search() requiere un texto de búsqueda");
  });

  it("should filter by category", () => {
    const w = createWhanda();
    expect(w.filterByCategory("Ropa")).toHaveLength(3);
  });

  it("should get related products by relatedIds", () => {
    const w = createWhanda();
    const related = w.getRelatedProducts("5");
    expect(related).toHaveLength(2);
    expect(related.map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("should get related products by same category when no relatedIds", () => {
    const w = createWhanda();
    const related = w.getRelatedProducts("1");
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((p) => p.category === "Ropa")).toBe(true);
  });

  it("should return empty array for non-existent product relations", () => {
    const w = createWhanda();
    expect(w.getRelatedProducts("999")).toEqual([]);
  });

  it("should filter products with getProducts filter", () => {
    const w = createWhanda();
    expect(w.getProducts({ category: "Ropa" })).toHaveLength(3);
    expect(w.getProducts({ minPrice: 2000 })).toHaveLength(2);
    expect(w.getProducts({ maxPrice: 1000 })).toHaveLength(1);
    expect(w.getProducts({ search: "zapatos" })).toHaveLength(1);
  });

  it("should sort products", () => {
    const w = createWhanda();
    const sorted = w.getProducts({ sort: "price", order: "asc" });
    expect(sorted[0].price).toBe(800);
    expect(sorted[sorted.length - 1].price).toBe(3500);
  });

  it("should limit products", () => {
    const w = createWhanda();
    expect(w.getProducts({ limit: 2 })).toHaveLength(2);
  });
});

// =========================================================
// RECOMMENDATIONS
// =========================================================

describe("Recommendations", () => {
  it("should get upsells by upsellIds", () => {
    const w = createWhanda();
    const upsells = w.getUpsells("5");
    expect(upsells).toHaveLength(1);
    expect(upsells[0].id).toBe("3");
  });

  it("should get upsells by category when no upsellIds", () => {
    const w = createWhanda();
    const upsells = w.getUpsells("1");
    expect(upsells.every((p) => p.price > 1200)).toBe(true);
  });

  it("should get cross-sells by crossSellIds", () => {
    const w = createWhanda();
    const cross = w.getCrossSells("5");
    expect(cross).toHaveLength(1);
    expect(cross[0].id).toBe("4");
  });

  it("should get cross-sells fallback to related when no crossSellIds", () => {
    const w = createWhanda();
    const cross = w.getCrossSells("1");
    expect(cross.length).toBeGreaterThan(0);
  });

  it("should get for cart recommendations", () => {
    const w = createWhanda();
    w.addItem("1");
    const recs = w.getForCart();
    expect(recs.every((p) => p.category === "Ropa" && p.id !== "1")).toBe(true);
  });

  it("should return empty when cart is empty for getForCart", () => {
    const w = createWhanda();
    expect(w.getForCart()).toEqual([]);
  });
});

// =========================================================
// CART
// =========================================================

describe("Cart", () => {
  let w;
  beforeEach(() => { w = createWhanda(); });

  it("should add item to cart", async () => {
    await w.addItem("1");
    expect(w.getCart()).toHaveLength(1);
    expect(w.getCart()[0].productId).toBe("1");
    expect(w.getCart()[0].quantity).toBe(1);
  });

  it("should add multiple quantities", async () => {
    await w.addItem("1", 3);
    expect(w.getCart()[0].quantity).toBe(3);
  });

  it("should increment quantity for existing item", async () => {
    await w.addItem("1");
    await w.addItem("1", 2);
    expect(w.getCart()[0].quantity).toBe(3);
  });

  it("should throw for non-existent product", async () => {
    await expect(w.addItem("999")).rejects.toThrow("Producto no encontrado");
  });

  it("should throw for invalid quantity", async () => {
    await expect(w.addItem("1", 0)).rejects.toThrow("La cantidad debe ser un número entero positivo");
    await expect(w.addItem("1", -1)).rejects.toThrow("La cantidad debe ser un número entero positivo");
    await expect(w.addItem("1", 1.5)).rejects.toThrow("La cantidad debe ser un número entero positivo");
  });

  it("should throw for insufficient stock", async () => {
    await expect(w.addItem("1", 30)).rejects.toThrow("Stock insuficiente");
  });

  it("should throw when incrementing exceeds stock", async () => {
    await w.addItem("1", 20);
    await expect(w.addItem("1", 10)).rejects.toThrow("Stock insuficiente");
  });

  it("should not check stock when stock is null", async () => {
    w.setProducts([{ id: "x", name: "No Stock", price: 100, category: "Test", image: "x.jpg" }]);
    await w.addItem("x", 999);
    expect(w.getCart()[0].quantity).toBe(999);
  });

  it("should remove item from cart", async () => {
    await w.addItem("1");
    await w.addItem("2");
    w.removeCartItem("1");
    expect(w.getCart()).toHaveLength(1);
    expect(w.getCart()[0].productId).toBe("2");
  });

  it("should update quantity", async () => {
    await w.addItem("1");
    w.updateQuantity("1", 5);
    expect(w.getCart()[0].quantity).toBe(5);
  });

  it("should remove item when updating quantity to 0", async () => {
    await w.addItem("1");
    w.updateQuantity("1", 0);
    expect(w.getCart()).toHaveLength(0);
  });

  it("should throw for invalid updateQuantity", async () => {
    await w.addItem("1");
    expect(() => w.updateQuantity("1", -1)).toThrow("La cantidad debe ser un número entero no negativo");
  });

  it("should throw when updating non-cart item", () => {
    expect(() => w.updateQuantity("999", 1)).toThrow("Producto no encontrado en el carrito");
  });

  it("should throw when updateQuantity exceeds stock", async () => {
    await w.addItem("1");
    expect(() => w.updateQuantity("1", 30)).toThrow("Stock insuficiente");
  });

  it("should check if cart has item", async () => {
    await w.addItem("1");
    expect(w.hasCartItem("1")).toBe(true);
    expect(w.hasCartItem("2")).toBe(false);
  });

  it("should get cart item count", async () => {
    await w.addItem("1", 2);
    await w.addItem("2", 3);
    expect(w.getCartItemCount()).toBe(5);
  });

  it("should clear cart", async () => {
    await w.addItem("1");
    w.clearCart();
    expect(w.getCart()).toHaveLength(0);
  });


});

// =========================================================
// PRICING
// =========================================================

describe("Pricing", () => {
  let w;
  beforeEach(() => { w = createWhanda(); });

  it("should calculate subtotal", async () => {
    await w.addItem("1", 2);
    await w.addItem("2");
    expect(w.getSubtotal()).toBe(1200 * 2 + 2500);
  });

  it("should return 0 subtotal for empty cart", () => {
    expect(w.getSubtotal()).toBe(0);
  });

  it("should calculate fixed shipping", async () => {
    w.updateConfig({ shipping: { type: "fixed", value: 500, freeFrom: null } });
    await w.addItem("1");
    expect(w.getShippingCost()).toBe(500);
  });

  it("should calculate free shipping above threshold", async () => {
    w.updateConfig({ shipping: { type: "fixed", value: 500, freeFrom: 2000 } });
    await w.addItem("2");
    expect(w.getShippingCost()).toBe(0);
  });

  it("should calculate per-item shipping", async () => {
    w.updateConfig({ shipping: { type: "per_item", perItem: 100, value: 0, freeFrom: null } });
    await w.addItem("1", 3);
    expect(w.getShippingCost()).toBe(300);
  });

  it("should not trigger free shipping when freeFrom is 0 (falsy)", async () => {
    w.updateConfig({ shipping: { type: "fixed", value: 500, freeFrom: 0 } });
    await w.addItem("1");
    expect(w.getShippingCost()).toBe(500);
  });

  it("should calculate flat discount", async () => {
    await w.addItem("1");
    w.addCoupon({ code: "SAVE100", amount: 100 });
    w.applyCoupon("SAVE100");
    expect(w.getDiscountAmount()).toBe(100);
  });

  it("should calculate percent discount", async () => {
    await w.addItem("1");
    w.addCoupon({ code: "PCT10", amount: 10, type: "percent" });
    w.applyCoupon("PCT10");
    expect(w.getDiscountAmount()).toBe(120);
  });

  it("should cap percent discount with maxDiscount", async () => {
    await w.addItem("1");
    w.addCoupon({ code: "CAPPED", amount: 50, type: "percent", maxDiscount: 500 });
    w.applyCoupon("CAPPED");
    expect(w.getDiscountAmount()).toBe(500);
  });

  it("should return 0 discount when no coupon active", async () => {
    await w.addItem("1");
    expect(w.getDiscountAmount()).toBe(0);
  });

  it("should not allow negative total", async () => {
    await w.addItem("1");
    w.addCoupon({ code: "HUGE", amount: 99999 });
    w.applyCoupon("HUGE");
    expect(w.getTotal()).toBe(0);
  });

  it("should calculate total correctly", async () => {
    w.updateConfig({ shipping: { type: "fixed", value: 500, freeFrom: null } });
    await w.addItem("1");
    w.addCoupon({ code: "SAVE100", amount: 100 });
    w.applyCoupon("SAVE100");
    expect(w.getTotal()).toBe(1200 - 100 + 500);
  });

  it("should return full calculation with calculate()", async () => {
    await w.addItem("1");
    const calc = w.calculate();
    expect(calc).toHaveProperty("subtotal");
    expect(calc).toHaveProperty("shipping");
    expect(calc).toHaveProperty("discount");
    expect(calc).toHaveProperty("total");
  });

  it("should format price with locale", () => {
    const formatted = w.formatPrice(1200);
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });
});

// =========================================================
// COUPONS
// =========================================================

describe("Coupons", () => {
  let w;
  beforeEach(() => { w = createWhanda(); });

  it("should add a coupon", () => {
    w.addCoupon({ code: "SAVE100", amount: 100 });
    expect(w.getCoupons()).toHaveLength(1);
  });

  it("should throw if coupon has no code", () => {
    expect(() => w.addCoupon({ amount: 100 })).toThrow("'code'");
  });

  it("should throw if coupon has no amount", () => {
    expect(() => w.addCoupon({ code: "X" })).toThrow("'amount'");
  });

  it("should validate coupon code", () => {
    w.addCoupon({ code: "SAVE100", amount: 100 });
    expect(w.validateCoupon("SAVE100")).toBe(true);
    expect(w.validateCoupon("NOPE")).toBe(false);
  });

  it("should validateCoupon return false for non-string", () => {
    expect(w.validateCoupon(123)).toBe(false);
  });

  it("should apply coupon", async () => {
    w.addCoupon({ code: "SAVE100", amount: 100 });
    await w.addItem("1");
    w.applyCoupon("SAVE100");
    expect(w.getActiveCoupon().code).toBe("SAVE100");
  });

  it("should return applied coupon from applyCoupon", async () => {
    w.addCoupon({ code: "SAVE100", amount: 100, type: "flat" });
    await w.addItem("1");
    const result = w.applyCoupon("SAVE100");
    expect(result).toBeDefined();
    expect(result.code).toBe("SAVE100");
    expect(result.amount).toBe(100);
  });

  it("should throw for invalid coupon code", () => {
    expect(() => w.applyCoupon("NOPE")).toThrow("Cupón inválido");
  });

  it("should throw for expired coupon", async () => {
    w.addCoupon({ code: "OLD", amount: 100, expiresAt: "2020-01-01" });
    await w.addItem("1");
    expect(() => w.applyCoupon("OLD")).toThrow("expirado");
  });

  it("should throw for coupon exceeding maxUses", async () => {
    w.addCoupon({ code: "LIMITED", amount: 100, maxUses: 1, usedCount: 1 });
    await w.addItem("1");
    expect(() => w.applyCoupon("LIMITED")).toThrow("límite de usos");
  });

  it("should throw for coupon below minOrder", async () => {
    w.addCoupon({ code: "MIN5000", amount: 100, minOrder: 5000 });
    await w.addItem("1", 1);
    expect(() => w.applyCoupon("MIN5000")).toThrow("Monto mínimo");
  });

  it("should remove active coupon", async () => {
    w.addCoupon({ code: "SAVE100", amount: 100 });
    await w.addItem("1");
    w.applyCoupon("SAVE100");
    w.removeCoupon();
    expect(w.getActiveCoupon()).toBeNull();
  });

  it("should increment usedCount when creating order", async () => {
    w.addCoupon({ code: "USEME", amount: 100, maxUses: 5 });
    w.setWhatsAppNumber("1234567890");
    w.setCustomerName("Test");
    w.setCustomerAddress("Address");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.addItem("1");
    await w.applyCoupon("USEME");
    await w.createOrder();
    const coupon = w.getCoupons().find((c) => c.code === "USEME");
    expect(coupon.usedCount).toBe(1);
  });
});

// =========================================================
// SHIPPING
// =========================================================

describe("Shipping", () => {
  it("should get shipping methods", () => {
    const w = new Whanda();
    expect(w.getShippingMethods()).toEqual(["fixed", "free", "per_item"]);
  });

  it("should set fixed shipping", () => {
    const w = new Whanda();
    w.setFixedShipping(500);
    expect(w.config.shipping.type).toBe("fixed");
    expect(w.config.shipping.value).toBe(500);
  });

  it("should throw for negative fixed shipping", () => {
    const w = new Whanda();
    expect(() => w.setFixedShipping(-100)).toThrow("no negativo");
  });

  it("should set free shipping threshold", () => {
    const w = new Whanda();
    w.setFreeShippingFrom(2000);
    expect(w.config.shipping.freeFrom).toBe(2000);
  });

  it("should throw for invalid free shipping threshold", () => {
    const w = new Whanda();
    expect(() => w.setFreeShippingFrom(0)).toThrow("positivo");
    expect(() => w.setFreeShippingFrom(-100)).toThrow("positivo");
  });

  it("should set per-item shipping", () => {
    const w = new Whanda();
    w.setPerItemShipping(150);
    expect(w.config.shipping.type).toBe("per_item");
    expect(w.config.shipping.perItem).toBe(150);
  });

  it("should check isFreeShipping", async () => {
    const w = createWhanda();
    w.setFixedShipping(0);
    await w.addItem("1");
    expect(w.isFreeShipping()).toBe(true);
  });

  it("should get free shipping min", () => {
    const w = new Whanda();
    w.setFreeShippingFrom(2000);
    expect(w.getFreeShippingMin()).toBe(2000);
  });

  it("should set shipping method", () => {
    const w = new Whanda();
    w.setShippingMethod("per_item");
    expect(w.config.shipping.type).toBe("per_item");
  });

  it("should throw for invalid shipping method", () => {
    const w = new Whanda();
    expect(() => w.setShippingMethod("drone")).toThrow("Método de envío inválido");
  });
});

// =========================================================
// CUSTOMER
// =========================================================

describe("Customer", () => {
  it("should set and get customer name", () => {
    const w = new Whanda();
    w.setCustomerName("Juan");
    expect(w.getCustomer().name).toBe("Juan");
  });

  it("should set and get customer address", () => {
    const w = new Whanda();
    w.setCustomerAddress("Calle 123");
    expect(w.getCustomer().address).toBe("Calle 123");
  });

  it("should set and get customer notes", () => {
    const w = new Whanda();
    w.setCustomerNotes("Timbre azul");
    expect(w.getCustomer().notes).toBe("Timbre azul");
  });

  it("should return customer copy (not reference)", () => {
    const w = new Whanda();
    const c = w.getCustomer();
    c.name = "Hacked";
    expect(w.getCustomer().name).toBeNull();
  });
});

// =========================================================
// CHECKOUT & ORDERS
// =========================================================

describe("Checkout", () => {
  let w;
  beforeEach(() => {
    w = createWhanda();
    w.setWhatsAppNumber("1234567890");
  });

  it("should get payment methods", () => {
    expect(w.getPaymentMethods()).toEqual(["Cash", "Bank Transfer"]);
  });

  it("should get delivery methods", () => {
    expect(w.getDeliveryMethods()).toEqual(["Home Delivery", "In-store Pickup"]);
  });

  it("should set payment method", () => {
    w.setPaymentMethod("Cash");
    expect(w.state.checkout.paymentMethod).toBe("Cash");
  });

  it("should throw for invalid payment method", () => {
    expect(() => w.setPaymentMethod("Crypto")).toThrow("Método de pago inválido");
  });

  it("should set delivery method", () => {
    w.setDeliveryMethod("In-store Pickup");
    expect(w.state.checkout.deliveryMethod).toBe("In-store Pickup");
  });

  it("should throw for invalid delivery method", () => {
    expect(() => w.setDeliveryMethod("Drone")).toThrow("Método de entrega inválido");
  });

  it("should validate checkout", async () => {
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    expect(w.validateCheckout()).toBe(true);
  });

  it("should throw if cart empty", () => {
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    expect(() => w.validateCheckout()).toThrow("El carrito está vacío");
  });

  it("should throw if no customer name", async () => {
    await w.addItem("1");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    expect(() => w.validateCheckout()).toThrow("El nombre del cliente es requerido");
  });

  it("should throw if no address", async () => {
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    expect(() => w.validateCheckout()).toThrow("dirección del cliente es requerida");
  });

  it("should throw if no payment method", async () => {
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setDeliveryMethod("Home Delivery");
    expect(() => w.validateCheckout()).toThrow("El método de pago es requerido");
  });

  it("should throw if no delivery method", async () => {
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    expect(() => w.validateCheckout()).toThrow("El método de entrega es requerido");
  });

  it("should return preview", async () => {
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    const p = w.preview();
    expect(p).toHaveProperty("items");
    expect(p).toHaveProperty("customer");
    expect(p).toHaveProperty("subtotal");
    expect(p).toHaveProperty("total");
  });

  it("should create an order", async () => {
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    const order = await w.createOrder({ note: "test" });
    expect(order.id).toBeDefined();
    expect(order.items).toHaveLength(1);
    expect(order.total).toBe(1200);
    expect(order.status).toBe("pending");
    expect(order.meta.note).toBe("test");
  });

  it("should clear cart after order creation", async () => {
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.createOrder();
    expect(w.getCart()).toHaveLength(0);
  });

  it("should clear coupon after order creation", async () => {
    w.addCoupon({ code: "SAVE", amount: 100 });
    await w.addItem("1");
    w.applyCoupon("SAVE");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.createOrder();
    expect(w.getActiveCoupon()).toBeNull();
  });

  it("should clear checkout selections after order", async () => {
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.createOrder();
    expect(w.state.checkout.paymentMethod).toBeNull();
    expect(w.state.checkout.deliveryMethod).toBeNull();
  });
});

// =========================================================
// ORDERS
// =========================================================

describe("Orders", () => {
  let w;
  beforeEach(async () => {
    w = createWhanda();
    w.setWhatsAppNumber("1234567890");
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setCustomerAddress("Calle 123");
    w.setPaymentMethod("Cash");
    w.setDeliveryMethod("Home Delivery");
    await w.createOrder();
  });

  it("should get order by id", () => {
    const order = w.getLastOrder();
    expect(w.getOrder(order.id)).toBeTruthy();
  });

  it("should return null for non-existent order", () => {
    expect(w.getOrder(999999)).toBeNull();
  });

  it("should get last order", () => {
    const order = w.getLastOrder();
    expect(order).toBeTruthy();
    expect(order.status).toBe("pending");
  });

  it("should list all orders", () => {
    expect(w.listOrders()).toHaveLength(1);
  });

  it("should update order status", () => {
    const order = w.getLastOrder();
    w.updateOrderStatus(order.id, "confirmed");
    expect(w.getOrder(order.id).status).toBe("confirmed");
  });

  it("should throw for invalid status", () => {
    const order = w.getLastOrder();
    expect(() => w.updateOrderStatus(order.id, "invalid")).toThrow("Estado inválido");
  });

  it("should throw for non-existent order status update", () => {
    expect(() => w.updateOrderStatus(999999, "confirmed")).toThrow("Orden no encontrada");
  });

  it("should cancel order", () => {
    const order = w.getLastOrder();
    const cancelled = w.cancelOrder(order.id);
    expect(cancelled.id).toBe(order.id);
    expect(cancelled.status).toBe("cancelled");
    expect(w.listOrders()).toHaveLength(1);
  });

  it("should throw for non-existent order cancel", () => {
    expect(() => w.cancelOrder(999999)).toThrow("Orden no encontrada");
  });


});

// =========================================================
// PERSISTENCE
// =========================================================

describe("Persistence", () => {
  it("should save and load state", async () => {
    const w1 = createWhanda();
    await w1.addItem("1");
    const saved = w1.save();

    const w2 = new Whanda();
    w2.load(saved);
    expect(w2.getCart()).toHaveLength(1);
    expect(w2.getCart()[0].productId).toBe("1");
  });

  it("should save and load config", () => {
    const w1 = new Whanda({ currency: "EUR" });
    const saved = w1.save();

    const w2 = new Whanda();
    w2.load(saved);
    expect(w2.getConfig().currency).toBe("EUR");
  });

  it("should reset state", async () => {
    const w = createWhanda();
    await w.addItem("1");
    w.setCustomerName("Juan");
    w.setPaymentMethod("Cash");
    w.reset();
    expect(w.getCart()).toHaveLength(0);
    expect(w.getCustomer().name).toBeNull();
    expect(w.state.checkout.paymentMethod).toBeNull();
  });
});

// =========================================================
// WHATSAPP
// =========================================================

describe("WhatsApp", () => {
  let w;
  beforeEach(() => {
    w = createWhanda();
    w.setWhatsAppNumber("1234567890");
  });

  it("should set WhatsApp number", () => {
    w.setWhatsAppNumber("1234567890");
    expect(w.getConfig().whatsappNumber).toBe("1234567890");
  });

  it("should strip non-digits from WhatsApp number", () => {
    w.setWhatsAppNumber("+1 (234) 567-890");
    expect(w.getConfig().whatsappNumber).toBe("1234567890");
  });

  it("should throw for invalid WhatsApp number", () => {
    expect(() => w.setWhatsAppNumber("123")).toThrow("7 y 15 dígitos");
    expect(() => w.setWhatsAppNumber(true)).toThrow("texto o número");
  });

  it("should register a WhatsApp template", () => {
    w.registerWhatsAppTemplate("custom", (order) => `Order: ${order.total}`);
    expect(w.listWhatsAppTemplates()).toContain("custom");
  });

  it("should throw for invalid template registration", () => {
    expect(() => w.registerWhatsAppTemplate("", () => {})).toThrow("no vacío");
    expect(() => w.registerWhatsAppTemplate("x", "not fn")).toThrow("función");
  });

  it("should set active template", () => {
    w.registerWhatsAppTemplate("custom", () => "test");
    w.setWhatsAppTemplate("custom");
    expect(w.getWhatsAppTemplate("custom")).toBeTruthy();
  });

  it("should throw for non-existent template", () => {
    expect(() => w.setWhatsAppTemplate("nope")).toThrow("Plantilla no encontrada");
  });

  it("should list templates", () => {
    expect(w.listWhatsAppTemplates()).toContain("default");
  });

  it("should remove a template", () => {
    w.registerWhatsAppTemplate("temp", () => "x");
    w.removeWhatsAppTemplate("temp");
    expect(w.getWhatsAppTemplate("temp")).toBeNull();
  });

  it("should not remove default template", () => {
    expect(() => w.removeWhatsAppTemplate("default")).toThrow("No se puede eliminar");
  });

  it("should throw removing non-existent template", () => {
    expect(() => w.removeWhatsAppTemplate("nope")).toThrow("Plantilla no encontrada");
  });

  it("should fallback to default when removing active template", () => {
    w.registerWhatsAppTemplate("temp", () => "x");
    w.setWhatsAppTemplate("temp");
    w.removeWhatsAppTemplate("temp");
    expect(w.templates.active).toBe("default");
  });

  it("should generate message", async () => {
    const order = {
      items: [{ name: "Camisa", quantity: 2 }],
      customer: { name: "Juan", address: "Calle 123" },
      subtotal: 2400,
      shipping: 0,
      discount: 0,
      total: 2400,
      paymentMethod: "Cash",
      deliveryMethod: "Home Delivery",
    };
    const msg = await w.generateMessage(order);
    expect(msg).toContain("Juan");
    expect(msg).toContain("2400");
  });

  it("should generate WhatsApp link", async () => {
    const order = {
      items: [{ name: "Test", quantity: 1 }],
      customer: { name: "Test" },
      subtotal: 100,
      shipping: 0,
      discount: 0,
      total: 100,
    };
    const link = await w.generateLink(order);
    expect(link).toContain("https://wa.me/1234567890?text=");
  });

  it("should throw if WhatsApp number not set for link", async () => {
    const w2 = new Whanda();
    const order = { items: [], customer: {}, subtotal: 0, shipping: 0, discount: 0, total: 0 };
    await expect(w2.generateLink(order)).rejects.toThrow("Número de WhatsApp no configurado");
  });

  it("should send to WhatsApp", async () => {
    const order = {
      items: [{ name: "Test", quantity: 1 }],
      customer: { name: "Test" },
      subtotal: 100,
      shipping: 0,
      discount: 0,
      total: 100,
    };
    const link = await w.sendToWhatsApp(order);
    expect(link).toContain("wa.me");
  });

  it("should preview WhatsApp template", () => {
    const order = { items: [], customer: {}, subtotal: 0 };
    const msg = w.previewWhatsAppTemplate("default", order);
    expect(typeof msg).toBe("string");
  });

  it("should throw preview for non-existent template", () => {
    expect(() => w.previewWhatsAppTemplate("nope", {})).toThrow("Plantilla no encontrada");
  });
});

// =========================================================
// SYNC
// =========================================================

describe("Sync", () => {
  it("should pass through data in sync", async () => {
    const w = new Whanda();
    const result = await w.sync({ test: true });
    expect(result.test).toBe(true);
  });
});
