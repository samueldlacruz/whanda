<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
  <img src="./landing/logo.png" alt="Whanda Logo" width="100" />
  <h1>Whanda</h1>
</div>

**Headless Catalog + WhatsApp Checkout**

A lightweight framework for building product catalogs with cart and checkout optimized for WhatsApp.

---

## What is Whanda

Whanda is a headless JavaScript framework that enables building product catalogs with cart, dynamic pricing, and WhatsApp checkout. It's not traditional e-commerce — it's a simplified sales flow for markets where WhatsApp is the primary closing channel.

**Flow:** Discovery → Web Catalog → Cart → WhatsApp → Manual close

---

## Features

- **Product catalog** with search, filters, and sorting
- **Shopping cart** with real-time stock validation
- **Dynamic pricing** — fixed shipping, per-item, or free above threshold
- **Coupons** — fixed amount, percentage, expiration, usage limits, minimum order
- **Full checkout** with payment and delivery methods
- **Orders with status** — pending, confirmed, shipped, delivered, cancelled
- **Multi-currency** — multiple currency support with auto-conversion
- **Multi-region** — tax and shipping by region (e.g. ITBIS in DR)
- **WhatsApp** — link generation, catalog sharing, thank-you page
- **Persistence** — save/load for localStorage with cache TTL
- **Scalability** — lazy loading, pagination, multiple data sources
- **Security** — string sanitization, JSON validation, rate limiting
- **Hook system** — customize any step of the flow
- **Google Sheets adapter** — load products from a spreadsheet
- **Zero dependencies** — single file, no external libraries

### Optional plugins
- **Seasons** — date-based promotions
- **Urgency & scarcity** — low stock alerts, countdowns
- **Bundles** — grouped products with discount
- **Downsells** — cart abandonment offers
- **CRO data** — free shipping progress, recently viewed tracking, social proof data (you render the UI)

---

## Size

| File | Size |
|---------|--------|
| `whanda.min.js` (IIFE) | ~26 KB |
| `whanda-plugins.min.js` (plugins) | ~4 KB |
| `whanda-extensions.min.js` (extensions) | ~0.5 KB |
| `whanda.esm.min.js` (ES Module) | ~31 KB |
| With gzip (core) | ~8-10 KB |

---

## Installation

No npm required. Just copy the files from the `dist/` directory to your project.

**Recommended structure:**
```
your-project/
├── index.html
├── whanda.min.js           # ← copied from dist/whanda.min.js
├── whanda-plugins.min.js   # ← optional, copied from dist/whanda-plugins.min.js
└── whanda-esm/             # ← optional, copied from dist/ (for ES Modules)
```

### Script tag (HTML)
```html
<!-- Core (~26KB) -->
<script src="whanda.min.js"></script>
<!-- Optional plugins (~4KB) — only if you need them -->
<script src="whanda-plugins.min.js"></script>
```

### ES Module
```js
import { Whanda } from "./whanda.esm.min.js";
// Whanda, loadFromSheets, initPlugins, initExtensions are all exported from the same file

initPlugins(Whanda);
```

---

## Quick Start

```html
<script src="whanda.min.js"></script>
<script src="whanda-plugins.min.js"></script>
<script>
  const w = new Whanda({ whatsappNumber: "1234567890" });

  w.setProducts([
    { id: "1", name: "Camisa", price: 1200, stock: 25, category: "Ropa", image: "camisa.jpg" }
  ]);

  await w.addItem("1");
  w.setCustomerName("Juan");
  w.setCustomerAddress("Calle 123");
  w.setPaymentMethod("Efectivo");
  w.setDeliveryMethod("Home Delivery");

  const order = await w.createOrder();
  const link = await w.sendToWhatsApp(order);
  window.open(link, "_blank");
</script>
```

---

## Example 1: Accessories Store

```html
<script src="whanda.min.js"></script>
<script src="whanda-plugins.min.js"></script>
<script>
  const accesorios = new Whanda({ whatsappNumber: "8095551234" });

  accesorios.setProducts([
    { id: "a1", name: "Lentes de Sol", price: 1500, stock: 20, category: "Lentes", image: "lentes.jpg" },
    { id: "a2", name: "Reloj Clásico", price: 3500, stock: 4, category: "Relojes", image: "reloj.jpg" },
    { id: "a3", name: "Bolso Cuero", price: 4200, stock: 8, category: "Bolsos", image: "bolso.jpg" },
    { id: "a4", name: "Collar Plata", price: 2800, stock: 15, category: "Joyería", image: "collar.jpg",
      relatedIds: ["a2"] }
  ]);

  accesorios.setFixedShipping(200);
  accesorios.setProductUrgency("a2", { lowStock: 5, badge: "¡Últimas unidades!" });

  accesorios.addCoupon({ code: "ACCESORIOS10", amount: 10, type: "percent" });

  async function checkoutAccesorios() {
    await accesorios.addItem("a1");
    await accesorios.addItem("a4");
    accesorios.applyCoupon("ACCESORIOS10");
    accesorios.setCustomerName("María López");
    accesorios.setCustomerAddress("Av. Principal #123, Santo Domingo");
    accesorios.setPaymentMethod("Efectivo");
    accesorios.setDeliveryMethod("Home Delivery");
    const order = await accesorios.createOrder();
    const link = await accesorios.sendToWhatsApp(order);
    window.open(link, "_blank");
  }
</script>
```

---

## Example 2: Bakery

```html
<script src="whanda.min.js"></script>
<script src="whanda-plugins.min.js"></script>
<script>
  const bakery = new Whanda({ whatsappNumber: "8095559999" });

  bakery.setProducts([
    { id: "r1", name: "Torta de Chocolate", price: 2500, stock: 5, category: "Tortas", image: "torta.jpg" },
    { id: "r2", name: "Cupcakes (6 uds)", price: 900, stock: 30, category: "Pastelería", image: "cupcakes.jpg" },
    { id: "r3", name: "Galletas Artesanales", price: 450, stock: 50, category: "Galletas", image: "galletas.jpg" },
    { id: "r4", name: "Pan de Campo", price: 350, stock: 20, category: "Pan", image: "pan.jpg" }
  ]);

  bakery.setFreeShippingFrom(1000);

  bakery.addCoupon({ code: "DULCE10", amount: 10, type: "percent", minOrder: 500 });

  bakery.createSeason({
    id: "navidad-2024",
    name: "Navidad 2024",
    start: "2024-12-01",
    end: "2024-12-31",
    type: "promotion",
    discount: 15
  });

  async function checkoutBakery() {
    await bakery.addItem("r1");
    await bakery.addItem("r2", 2);
    bakery.applyCoupon("DULCE10");
    bakery.setCustomerName("Carlos García");
    bakery.setCustomerAddress("Calle 5, Residencial Villa, #45");
    bakery.setPaymentMethod("Pago móvil");
    bakery.setDeliveryMethod("Home Delivery");
    const order = await bakery.createOrder();
    const link = await bakery.sendToWhatsApp(order);
    window.open(link, "_blank");
  }
</script>
```

---

## Example 3: Clothing Store

```html
<script src="whanda.min.js"></script>
<script src="whanda-plugins.min.js"></script>
<script>
  const ropa = new Whanda({ whatsappNumber: "8095557777" });

  ropa.setProducts([
    { id: "c1", name: "Camisa Blanca", price: 1200, stock: 25, category: "Camisas", image: "camisa.jpg",
      relatedIds: ["c2", "c3"], upsellIds: ["c4"] },
    { id: "c2", name: "Pantalón Negro", price: 2500, stock: 15, category: "Pantalones", image: "pantalon.jpg",
      relatedIds: ["c1"] },
    { id: "c3", name: "Vestido Floral", price: 3200, stock: 12, category: "Vestidos", image: "vestido.jpg" },
    { id: "c4", name: "Chaqueta Denim", price: 4500, stock: 8, category: "Chaquetas", image: "chaqueta.jpg",
      crossSellIds: ["c1", "c2"] }
  ]);

  ropa.setPerItemShipping(50);

  ropa.addCoupon({ code: "MODA20", amount: 20, type: "percent", maxDiscount: 1000 });

  ropa.createBundle({
    id: "combo-verano",
    name: "Combo Camisa + Pantalón",
    products: ["c1", "c2"],
    type: "percent",
    discount: 15
  });

  ropa.setCRO({
    freeShippingBar: true,
    freeShippingGoal: 3000,
    lowStockAlert: true,
    recentlyViewed: true
  });

  ropa.setProductUrgency("c4", { lowStock: 3, badge: "¡Solo quedan 8!" });

  async function checkoutRopa() {
    await ropa.addBundle("combo-verano");
    await ropa.addItem("c4");
    ropa.applyCoupon("MODA20");
    ropa.setCustomerName("Ana Martínez");
    ropa.setCustomerAddress("Urbanización Las Flores, #45");
    ropa.setPaymentMethod("Tarjeta");
    ropa.setDeliveryMethod("Home Delivery");
    const order = await ropa.createOrder();
    const link = await ropa.sendToWhatsApp(order);
    window.open(link, "_blank");
  }
</script>
```

---

## Google Sheets as a database

Load products directly from a Google Sheet without a backend. The adapter converts CSV from the sheet into Whanda products.

### CSV format

Required columns (first row):
```
id,name,price,stock,category,image
```

Optional columns (parsed from comma-separated to arrays):
```
relatedIds,upsellIds,crossSellIds
```

### Direct usage (public sheet)

The sheet must be set to "Anyone with the link can view".

**Opción A — HTML (script tags):**
```html
<script src="whanda.min.js"></script>
<script>
  const w = new Whanda({ whatsappNumber: "1234567890" });

  Whanda.loadFromSheets(w, {
    sheetUrl: "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=0"
  }).then(() => {
    console.log(w.getProducts());
  });
</script>
```

**Opción B — ES Module:**
```js
import { Whanda } from "whanda";
import { loadFromSheets } from "whanda/sheets";

const w = new Whanda({ whatsappNumber: "1234567890" });

await loadFromSheets(w, {
  sheetUrl: "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=0"
});

console.log(w.getProducts());
```

### With proxy (recommended for production)

To avoid exposing the sheet URL, use a serverless proxy. See `examples/vercel-proxy/` for a Vercel example.

```js
await loadFromSheets(w, {
  proxyUrl: "https://my-app.vercel.app/api/products"
});
```

The proxy must return:
- CSV with content-type `text/csv`, or
- JSON with `{ csv: "..." }` or `{ products: [...] }`

---

## Generate Store with AI Agent / Vibecoding

Copy this prompt and paste it into your favorite AI agent:

> **Prompt:**
>
> Using the whanda.min.js and whanda-plugins.min.js files from the project, create a [ACCESSORIES / BAKERY / CLOTHING / ELECTRONICS / OTHER] store in a single HTML file.
>
> **IMPORTANT:** Do not use npm. Do not `import` packages. The whanda.min.js and whanda-plugins.min.js files are already available in the project — just copy them to the same directory as the HTML (or reference the correct path).
>
> **Flow:** Catalog → Cart → WhatsApp → Manual close (no backend or payment gateway).
>
> **Technical requirements:**
> 1. Copy whanda.min.js and whanda-plugins.min.js to the same directory as the HTML
> 2. Include `<script src="whanda.min.js">` + `<script src="whanda-plugins.min.js">`
> 3. Instance: `new Whanda({ whatsappNumber: "NUM", shipping: { type: "fixed", value: X, freeFrom: Y } })`
> 4. Products: `w.setProducts([{ id, name, price, stock, category, image }])`
> 5. Cart: `await w.addItem(id)`, `w.getCart()`, `w.updateQuantity(id, qty)`
> 6. Checkout: `w.setCustomerName()`, `w.setCustomerAddress()`, `w.setPaymentMethod()`, `w.setDeliveryMethod()`
> 7. WhatsApp: `const order = await w.createOrder(); window.open(await w.sendToWhatsApp(order))`
> 8. CRO (plugins): `w.setCRO({ freeShippingBar: true, freeShippingGoal: Y })` for progress bar
> 9. Urgency (plugins): `w.setProductUrgency(id, { lowStock: N, badge: "..." })` for stock alerts
> 10. Coupon: `w.addCoupon({ code: "X", amount: N, type: "percent" })`
> 11. Responsive design with Tailwind CSS
>
> **Minimal structure:**
> ```html
> <script src="whanda.min.js"></script>
> <script src="whanda-plugins.min.js"></script>
> <script>
>   const w = new Whanda({ whatsappNumber: "NUM", shipping: { type: "fixed", value: 200, freeFrom: 3000 } });
>   w.setProducts([...]);
>   w.setCRO({ freeShippingBar: true, freeShippingGoal: 3000 });
>   w.setProductUrgency("id", { lowStock: 3, badge: "¡Solo 3!" });
>   w.addCoupon({ code: "DESCUENTO10", amount: 10, type: "percent" });
> </script>
> ```
>
> **File instructions:**
> - whanda.min.js (core, ~26KB) — required
> - whanda-plugins.min.js (plugins, ~4KB) — optional but recommended
> - Both files are in the project; copy them to the same directory as the HTML to use relative paths

---

## Quick API Reference

| Method | Description |
|--------|-------------|
| `new Whanda(config)` | Create instance |
| `setProducts(products)` | Load catalog |
| `getProducts(filter)` | Get products with filters |
| `addItem(id, qty)` | Add to cart |
| `getCart()` | Get cart items |
| `getRelatedProducts(id)` | Get related products |
| `generateLink(order)` | Generate WhatsApp link |
| `generateMessage(order)` | Generate WhatsApp message |
| `createOrder()` | Create order |
| `sendToWhatsApp(order)` | Generate WhatsApp link |
| `addCoupon(config)` * | Register coupon |
| `applyCoupon(code)` | Apply coupon |
| `setFixedShipping(value)` | Fixed shipping |
| `setFreeShippingFrom(n)` | Free shipping from |
| `createSeason(config)` * | Create season |
| `setProductUrgency(id, c)` * | Configure urgency |
| `createBundle(config)` * | Create bundle |
| `addBundle(id)` * | Add bundle to cart |
| `setCRO(config)` * | Configure CRO |
| `save() / load(json)` | Persistence |

\* Requires whanda-plugins.min.js

---

## Full Documentation

- [DOC.md](./DOC.md) — Complete reference of all methods
- [USAGE.md](./USAGE.md) — Complete guide for AI agents and developers
- [JSDoc](./src/whanda.js) — Inline documentation in the source code

---

## License

MIT