import { describe, it, expect, beforeEach } from "vitest";
import { Whanda } from "../src/whanda.js";
import { initExtensions } from "../src/whanda-extensions.js";

initExtensions(Whanda);

const sampleProducts = [
  { id: "1", name: "Camisa Azul", price: 1200, stock: 25, category: "Ropa", image: "img1.jpg" },
];

describe("Extensions", () => {
  describe("exportOrders", () => {
    let w;
    beforeEach(async () => {
      w = new Whanda();
      w.setProducts(sampleProducts);
      w.setWhatsAppNumber("1234567890");
      await w.addItem("1");
      w.setCustomerName("Juan");
      w.setCustomerAddress("Calle 123");
      w.setPaymentMethod("Cash");
      w.setDeliveryMethod("Home Delivery");
      await w.createOrder();
    });

    it("should export orders to CSV", () => {
      const csv = w.exportOrders();
      expect(csv).toContain("ID,Fecha,Cliente");
      expect(csv).toContain("Juan");
    });

    it("should return empty string for no orders", () => {
      const w2 = new Whanda();
      expect(w2.exportOrders()).toBe("");
    });

    it("should escape commas in CSV export", async () => {
      await w.cancelOrder(w.getLastOrder().id);
      await w.addItem("1");
      w.setCustomerName("Pérez, Juan");
      w.setCustomerAddress("Calle 123");
      w.setPaymentMethod("Cash");
      w.setDeliveryMethod("Home Delivery");
      await w.createOrder();
      const csv = w.exportOrders();
      expect(csv).toContain('"Pérez, Juan"');
    });
  });
});
