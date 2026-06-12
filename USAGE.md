# Whanda - Usage Guide for AI Agents

> For complete documentation of all methods, see [DOC.md](./DOC.md)

## What is Whanda

Headless framework for building product catalogs with WhatsApp checkout.

**Flow:** Catalog → Cart → WhatsApp → Manual close

**It's not traditional e-commerce.** No payment gateway, no user accounts, no backend. Just a catalog, a cart, and a WhatsApp link.

---

## Architecture

Whanda is split into 3 files:
- **whanda.min.js** — Core (cart, pricing, WhatsApp)
- **whanda-plugins.min.js** — Optional features (seasons, urgency, bundles, downsells, CRO)
- **whanda-extensions.min.js** — Infrequently used methods (exportOrders)

For HTML, include the script tags in order. For ESM:
```js
import { Whanda } from "whanda";
import { initPlugins } from "whanda/plugins";
initPlugins(Whanda);
```

---

## Quick Setup

### En HTML
```html
<script src="whanda.min.js"></script>
<script src="whanda-plugins.min.js"></script>
```

### In JavaScript (ES Module)
```js
import { Whanda } from "whanda";
import { initPlugins } from "whanda/plugins";
initPlugins(Whanda);
```

---

## Essential API (15 methods to get started)

### 1. Configure the instance
```js
const w = new Whanda({
  currency: "DOP",
  whatsappNumber: "1234567890",
  shipping: { type: "fixed", value: 200, freeFrom: 2000 }
});
```

### 2. Load products
```js
w.setProducts([
  {
    id: "1",
    name: "Camisa Azul",
    price: 1200,
    stock: 25,
    category: "Ropa",
    image: "https://ejemplo.com/camisa.jpg",
    relatedIds: ["2", "3"],    // opcional
    upsellIds: ["4"],           // opcional
    crossSellIds: ["5"]         // opcional
  }
]);
```

### 3. Add to cart
```js
await w.addItem("1", 2);  // product "1", quantity 2
```

### 4. Manage the cart
```js
w.getCart();              // → [{ productId, quantity, price, name }]
w.getCartItemCount();          // → total number of items
w.getSubtotal();               // → sum of price × quantity
w.updateQuantity("1", 3);      // change quantity
w.removeCartItem("1");         // remove item
w.clearCart();                 // clear all
w.hasCartItem("1");            // → true/false
```

### 5. Customer data
```js
w.setCustomerName("Juan Pérez");
w.setCustomerAddress("Calle 123, Santo Domingo");
w.setCustomerNotes("Timbre azul, apartamento 4B");
```

### 6. Payment and delivery methods
```js
w.setPaymentMethod("Efectivo");        // or 'Transfer', 'Card'
w.setDeliveryMethod("Home Delivery");  // or 'In-store Pickup'
```

### 7. Create order
```js
const order = await w.createOrder();
// order = { id, items, subtotal, shipping, discount, total, customer, status, ... }
```

### 8. Send via WhatsApp
```js
const link = await w.sendToWhatsApp(order);
window.open(link, "_blank");
```

### 9. Coupons
```js
w.addCoupon({ code: "AHORRA10", amount: 10, type: "percent" });
w.addCoupon({ code: "FIJO500", amount: 500, type: "flat", minOrder: 2000 });
w.applyCoupon("AHORRA10");
w.getActiveCoupon();  // → coupon object or null
w.removeCoupon();
```

### 10. Shipping
```js
w.setFixedShipping(200);           // fixed shipping
w.setFreeShippingFrom(2000);      // free from $2000
w.setPerItemShipping(50);         // $50 per item
w.getShippingCost();               // → calculated cost
w.isFreeShipping();                // → true/false
```

### 11. Seasons
> ⚠️ Requires whanda-plugins.min.js
```js
w.createSeason({
  id: "navidad",
  name: "Navidad 2024",
  start: "2024-12-01",
  end: "2024-12-31",
  type: "promotion",
  discount: 15
});
w.getActiveSeason();   // → season object or null
w.isInSeason("1");     // → true/false
```

### 12. Urgency & scarcity
> ⚠️ Requires whanda-plugins.min.js
```js
w.setProductUrgency("1", {
  lowStock: 3,
  badge: "¡Solo quedan 3!"
});
w.getUrgency("1");        // → { isUrgent, isLowStock, badge, ... }
w.getLowStockProducts();  // → [{ product, urgency }]
```

### 13. Bundles
> ⚠️ Requires whanda-plugins.min.js
```js
w.createBundle({
  id: "combo-ropa",
  name: "Combo Camisa + Pantalón",
  products: ["1", "2"],
  type: "percent",
  discount: 15
});
w.addBundle("combo-ropa", 1);  // adds both products to cart
w.getBundles();                 // → [bundle objects]
```

### 14. CRO (Conversion Rate Optimization)
> ⚠️ Requires whanda-plugins.min.js. CRO is headless — it provides data, you render the UI.
```js
w.setCRO({
  freeShippingBar: true,
  freeShippingGoal: 2000,
  lowStockAlert: true,
  recentlyViewed: true,
  exitIntent: true,
  exitMessage: "¡Toma un 10%!",
  exitDiscount: 10
});
w.getCROData();              // → { freeShippingProgress, lowStockProducts, ... }
w.checkFreeShippingProgress(); // → { current, goal, remaining, qualifies, progress }
w.trackProductView("1");     // track view
w.getRecentlyViewed();       // → [products]
```

### 15. Persistence
```js
const saved = w.save();     // → JSON string
w.load(saved);              // restore from JSON
w.reset();                  // clear cart, customer, checkout
```

---

## Product Structure

```js
{
  id: "string|number",      // Unique ID (required)
  name: "string",           // Name (required)
  price: number,            // Price (required)
  stock: number,            // Stock (null = unlimited)
  category: "string",       // Category (required)
  image: "string",          // Image URL
  relatedIds: ["id", ...],  // Related products
  upsellIds: ["id", ...],   // Upsells (more expensive products)
  crossSellIds: ["id", ...] // Cross-sells (complementary)
}
```

---

## Order Structure

```js
{
  id: number,               // Timestamp
  items: [{ productId, quantity, price, name }],
  subtotal: number,
  shipping: number,
  discount: number,
  total: number,
  customer: { name, address, notes },
  paymentMethod: "string",
  deliveryMethod: "string",
  status: "pending",        // pending|confirmed|shipped|delivered|cancelled
  meta: {},
  createdAt: "ISO string"
}
```

---

## Available Hooks

```js
w.on("beforeAddToCart", (payload) => { /* payload: { productId, quantity } */ });
w.on("afterAddToCart", (cart) => { /* cart: items array */ });
w.on("afterCartChange", (cart) => { /* cart: items array */ });
w.on("beforeCheckout", (meta) => { /* meta: order metadata */ });
w.on("afterCheckout", (order) => { /* order: created order */ });
w.on("beforeWhatsAppSend", (order) => { /* order */ });
w.on("beforeGenerateWhatsApp", (message) => { /* message: string */ });
w.on("afterGenerateWhatsApp", (message) => { /* message: string */ });
w.on("onCartEmpty", (data) => { /* data: { cart } */ });
w.on("onRemoveItem", (data) => { /* data: { productId, cart } */ });
```

To unsubscribe: `w.off("hookName", fn)`

---

## WhatsApp Template

```js
// Use custom template
w.registerWhatsAppTemplate("minimo", (order) => {
  return `Pedido: ${order.items.map(i => i.name).join(", ")}\nTotal: $${order.total}`;
});
w.setWhatsAppTemplate("minimo");

// Available templates
w.listWhatsAppTemplates();  // → ["default", "minimo"]
```

---

## Complete Example (minimal HTML)

```html
<!DOCTYPE html>
<html>
<head><title>Store</title></head>
<body>
  <div id="app"></div>
  <script src="whanda.min.js"></script>
  <script src="whanda-plugins.min.js"></script>
  <script>
    const w = new Whanda({ whatsappNumber: "1234567890" });
    w.setProducts([
      { id: "1", name: "Producto", price: 1000, stock: 10, category: "Cat", image: "img.jpg" }
    ]);
    document.getElementById("app").innerHTML = w.getProducts().map(p =>
      `<div><h3>${p.name}</h3><p>$${p.price}</p><button onclick="w.addItem('${p.id}')">Add</button></div>
    `).join("");
  </script>
</body>
</html>
```

---

## Extensions

> ⚠️ Requires whanda-extensions.min.js

```html
<script src="whanda.min.js"></script>
<script src="whanda-extensions.min.js"></script>
```

```js
w.exportOrders();  // → export orders
```

---

## Google Sheets Adapter

Load products from a Google Sheet without a backend.

### Import

```js
import { loadFromSheets, parseCSV, buildGoogleSheetsCsvUrl } from "whanda/sheets";
```

### CSV Format

First row = headers (case-insensitive):

| Column | Required | Type | Description |
|---------|-----------|------|-------------|
| `id` | Yes | string | Product unique ID |
| `name` | Yes | string | Name |
| `price` | Yes | number | Price |
| `stock` | Yes | number | Stock (0 = out of stock) |
| `category` | Yes | string | Category |
| `image` | Yes | string | Image URL |
| `relatedIds` | No | string | Comma-separated IDs |
| `upsellIds` | No | string | Comma-separated IDs |
| `crossSellIds` | No | string | Comma-separated IDs |

CSV example:
```
id,name,price,stock,category,image,relatedIds
1,Camisa Azul,1200,25,Ropa,camisa.jpg,2,3
2,Pantalón Negro,2500,15,Ropa,pantalon.jpg,1
```

### Direct loading (public sheet)

```js
const w = new Whanda({ whatsappNumber: "1234567890" });

await loadFromSheets(w, {
  sheetUrl: "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=0"
});

// Products loaded automatically
w.getProducts(); // → [{ id, name, price, ... }]
```

### Proxy loading (production)

To avoid exposing the sheet URL:

```js
await loadFromSheets(w, {
  proxyUrl: "https://my-app.vercel.app/api/products"
});
```

The proxy must return CSV (`text/csv`) or JSON:
- `{ csv: "id,name,...\n1,Camisa,..." }`
- `{ products: [{ id: "1", name: "Camisa", ... }] }`

See `examples/vercel-proxy/` for a complete Vercel example.

### Helper functions

```js
import { parseCSV, buildGoogleSheetsCsvUrl } from "whanda/sheets";

// Parse CSV to products (without loading into Whanda)
const products = parseCSV(csvText);

// Convert Sheets URL to CSV export URL
const csvUrl = buildGoogleSheetsCsvUrl("https://docs.google.com/spreadsheets/d/ABC/edit?gid=0");
// → "https://docs.google.com/spreadsheets/d/ABC/export?format=csv&gid=0"
```
