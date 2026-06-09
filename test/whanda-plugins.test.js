import { describe, it, expect, beforeEach } from "vitest";
import { Whanda } from "../src/whanda.js";
import { initPlugins } from "../src/whanda-plugins.js";

initPlugins(Whanda);

const sampleProducts = [
  { id: "1", name: "Camisa Azul", price: 1200, stock: 25, category: "Ropa", image: "img1.jpg" },
  { id: "2", name: "Pantalón Negro", price: 2500, stock: 15, category: "Ropa", image: "img2.jpg" },
  { id: "3", name: "Zapatos Café", price: 3500, stock: 10, category: "Calzado", image: "img3.jpg" },
  { id: "4", name: "Gorra Roja", price: 800, stock: 0, category: "Accesorios", image: "img4.jpg" },
];

function createWhanda() {
  const w = new Whanda();
  w.setProducts(sampleProducts);
  return w;
}

// =========================================================
// DOWNSSELLS
// =========================================================

describe("Downsells", () => {
  let w;

  beforeEach(() => {
    w = createWhanda();
  });

  it("should set and get downsell config", () => {
    const config = { trigger: "cart_abandon", offer: "10% off", delay: 30 };
    w.setDownsell(config);
    const result = w.getDownsell();
    expect(result).toEqual(config);
  });

  it("should return null when no downsell", () => {
    expect(w.getDownsell()).toBeNull();
  });

  it("should clear downsell", () => {
    w.setDownsell({ trigger: "exit", offer: "free shipping" });
    w.clearDownsell();
    expect(w.getDownsell()).toBeNull();
  });
});

// =========================================================
// SEASONS
// =========================================================

describe("Seasons", () => {
  let w;

  beforeEach(() => {
    w = createWhanda();
  });

  it("should create a season", () => {
    const season = {
      id: "summer",
      name: "Summer Sale",
      start: "2020-01-01",
      end: "2030-12-31",
      products: ["1", "2"],
    };
    w.createSeason(season);
    expect(w.getSeasons()).toHaveLength(1);
    expect(w.getSeasons()[0].id).toBe("summer");
  });

  it("should throw if season missing required fields", () => {
    expect(() => w.createSeason({ id: "s1" })).toThrow("Season requires id, name, start, and end");
    expect(() => w.createSeason({ name: "No ID" })).toThrow("Season requires id, name, start, and end");
    expect(() => w.createSeason({ id: "s2", name: "No Dates" })).toThrow("Season requires id, name, start, and end");
  });

  it("should get seasons", () => {
    w.createSeason({ id: "s1", name: "Season 1", start: "2020-01-01", end: "2030-12-31" });
    w.createSeason({ id: "s2", name: "Season 2", start: "2020-01-01", end: "2030-12-31" });
    const seasons = w.getSeasons();
    expect(seasons).toHaveLength(2);
    expect(seasons[0].name).toBe("Season 1");
    expect(seasons[1].name).toBe("Season 2");
  });

  it("should get active season", () => {
    w.createSeason({
      id: "active",
      name: "Current Season",
      start: "2020-01-01",
      end: "2030-12-31",
      products: ["1"],
    });
    w.createSeason({
      id: "past",
      name: "Past Season",
      start: "2000-01-01",
      end: "2000-12-31",
      products: ["2"],
    });
    const active = w.getActiveSeason();
    expect(active).not.toBeNull();
    expect(active.id).toBe("active");
  });

  it("should check if product is in season", () => {
    w.createSeason({
      id: "winter",
      name: "Winter Sale",
      start: "2020-01-01",
      end: "2030-12-31",
      products: ["1", "3"],
    });
    expect(w.isInSeason("1")).toBe(true);
    expect(w.isInSeason("3")).toBe(true);
    expect(w.isInSeason("2")).toBe(false);
  });

  it("should remove season", () => {
    w.createSeason({ id: "s1", name: "Season 1", start: "2020-01-01", end: "2030-12-31" });
    w.createSeason({ id: "s2", name: "Season 2", start: "2020-01-01", end: "2030-12-31" });
    w.removeSeason("s1");
    const seasons = w.getSeasons();
    expect(seasons).toHaveLength(1);
    expect(seasons[0].id).toBe("s2");
  });
});

// =========================================================
// URGENCY & SCARCITY
// =========================================================

describe("Urgency", () => {
  let w;

  beforeEach(() => {
    w = createWhanda();
  });

  it("should set product urgency", () => {
    w.setProductUrgency("1", { deadline: "2030-12-31", lowStock: 5 });
    const urgency = w.state.urgency["1"];
    expect(urgency).toEqual({ deadline: "2030-12-31", lowStock: 5 });
  });

  it("should get urgency with computed fields", () => {
    w.setProductUrgency("2", { deadline: "2030-12-31", lowStock: 20 });
    const result = w.getUrgency("2");
    expect(result).not.toBeNull();
    expect(result.isUrgent).toBe(false);
    expect(result.isLowStock).toBe(true);
    expect(result.isCountdownActive).toBe(true);
    expect(result.badge).toBe("Low Stock");
  });

  it("should clear product urgency", () => {
    w.setProductUrgency("1", { deadline: "2030-12-31", lowStock: 5 });
    w.clearProductUrgency("1");
    expect(w.getUrgency("1")).toBeNull();
  });

  it("should get low stock products", () => {
    w.setProductUrgency("1", { lowStock: 30 });
    w.setProductUrgency("2", { lowStock: 5 });
    w.setProductUrgency("3", { lowStock: 10 });
    const lowStock = w.getLowStockProducts();
    expect(lowStock).toHaveLength(2);
    expect(lowStock.map((p) => p.id)).toContain("1");
    expect(lowStock.map((p) => p.id)).toContain("3");
  });
});

// =========================================================
// BUNDLES
// =========================================================

describe("Bundles", () => {
  let w;

  beforeEach(() => {
    w = createWhanda();
  });

  it("should create a bundle", () => {
    w.createBundle({
      id: "b1",
      name: "Ropa Combo",
      products: [
        { productId: "1", quantity: 1 },
        { productId: "2", quantity: 1 },
      ],
      discount: 0.1,
    });
    const bundles = w.getBundles();
    expect(bundles).toHaveLength(1);
    expect(bundles[0].id).toBe("b1");
    expect(bundles[0].originalPrice).toBe(3700);
    expect(bundles[0].bundlePrice).toBeCloseTo(3330);
  });

  it("should throw if bundle missing required fields", () => {
    expect(() => w.createBundle({ id: "b1" })).toThrow("Bundle requires id, name, and products");
    expect(() => w.createBundle({ name: "No ID" })).toThrow("Bundle requires id, name, and products");
    expect(() => w.createBundle({ id: "b2", name: "No Products" })).toThrow("Bundle requires id, name, and products");
  });

  it("should get bundles and getBundle by id", () => {
    w.createBundle({
      id: "b1",
      name: "Bundle 1",
      products: [{ productId: "1", quantity: 1 }],
    });
    w.createBundle({
      id: "b2",
      name: "Bundle 2",
      products: [{ productId: "2", quantity: 1 }],
    });
    expect(w.getBundles()).toHaveLength(2);
    expect(w.getBundle("b1").name).toBe("Bundle 1");
    expect(w.getBundle("b2").name).toBe("Bundle 2");
    expect(w.getBundle("nonexistent")).toBeNull();
  });

  it("should add bundle to cart", async () => {
    w.createBundle({
      id: "b1",
      name: "Ropa Combo",
      products: [
        { productId: "1", quantity: 1 },
        { productId: "2", quantity: 2 },
      ],
    });
    await w.addBundle("b1");
    const cart = w.getCart();
    expect(cart).toHaveLength(2);
    const item1 = cart.find((i) => i.productId === "1");
    const item2 = cart.find((i) => i.productId === "2");
    expect(item1.quantity).toBe(1);
    expect(item2.quantity).toBe(2);
  });

  it("should remove bundle from cart", async () => {
    w.createBundle({
      id: "b1",
      name: "Ropa Combo",
      products: [
        { productId: "1", quantity: 1 },
        { productId: "2", quantity: 1 },
      ],
    });
    await w.addBundle("b1");
    expect(w.getCart()).toHaveLength(2);
    w.removeBundle("b1");
    expect(w.getCart()).toHaveLength(0);
  });

  it("should delete bundle", () => {
    w.createBundle({
      id: "b1",
      name: "Bundle 1",
      products: [{ productId: "1", quantity: 1 }],
    });
    expect(w.getBundles()).toHaveLength(1);
    w.deleteBundle("b1");
    expect(w.getBundles()).toHaveLength(0);
    expect(w.getBundle("b1")).toBeNull();
  });
});

// =========================================================
// CRO (Conversion Rate Optimization)
// =========================================================

describe("CRO", () => {
  let w;

  beforeEach(() => {
    w = createWhanda();
  });

  it("should set CRO config", () => {
    w.setCRO({
      freeShippingBar: true,
      exitIntent: true,
      exitMessage: "Wait! Here's 10% off",
      exitDiscount: 10,
    });
    expect(w.state.cro.freeShippingBar).toBe(true);
    expect(w.state.cro.exitIntent).toBe(true);
    expect(w.state.cro.exitMessage).toBe("Wait! Here's 10% off");
    expect(w.state.cro.exitDiscount).toBe(10);
  });

  it("should get CRO data", () => {
    w.setCRO({ freeShippingThreshold: 5000 });
    const data = w.getCROData();
    expect(data).toHaveProperty("freeShippingProgress");
    expect(data).toHaveProperty("lowStockProducts");
    expect(data).toHaveProperty("recentlyViewed");
    expect(data).toHaveProperty("exitIntent");
  });

  it("should track product view", () => {
    w.trackProductView("1");
    w.trackProductView("2");
    w.trackProductView("3");
    const recent = w.getRecentlyViewed();
    expect(recent).toHaveLength(3);
    expect(recent[0].id).toBe("3");
    expect(recent[1].id).toBe("2");
    expect(recent[2].id).toBe("1");
  });

  it("should get recently viewed products", () => {
    w.trackProductView("1");
    w.trackProductView("2");
    w.trackProductView("1");
    const recent = w.getRecentlyViewed();
    expect(recent).toHaveLength(2);
    expect(recent[0].id).toBe("1");
    expect(recent[1].id).toBe("2");
  });

  it("should check free shipping progress", () => {
    w.setCRO({ freeShippingThreshold: 5000 });
    const progress = w.checkFreeShippingProgress();
    expect(progress.threshold).toBe(5000);
    expect(progress.current).toBe(0);
    expect(progress.remaining).toBe(5000);
    expect(progress.qualifies).toBe(false);
    expect(progress.progress).toBe(0);
  });

  it("should get social proof data", () => {
    const proof = w.getSocialProof("1");
    expect(proof.productId).toBe("1");
    expect(typeof proof.viewers).toBe("number");
    expect(typeof proof.purchasers).toBe("number");
    expect(proof.message).toContain("people are viewing");
    expect(proof.recentPurchaseMessage).toContain("people bought");
  });
});
