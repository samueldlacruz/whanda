# Whanda - Guía de Uso para AI Agents

> Para documentación completa de todos los métodos, ver [DOC.md](./DOC.md)

## Qué es Whanda

Framework headless para construir tiendas de productos con checkout por WhatsApp.

**Flujo:** Catálogo → Carrito → WhatsApp → Cierre manual

**No es e-commerce tradicional.** No hay pasarela de pago, no hay cuentas de usuario, no hay backend. Solo un catálogo, un carrito, y un link de WhatsApp.

---

## Arquitectura

Whanda se divide en 3 archivos:
- **whanda.min.js** — Core (carrito, pricing, WhatsApp)
- **whanda-plugins.min.js** — Features opcionales (temporadas, urgency, bundles, downsells, CRO)
- **whanda-extensions.min.js** — Métodos poco usados (exportOrders)

Para HTML, incluir los script tags en orden. Para ESM:
```js
import { Whanda } from "whanda";
import { initPlugins } from "whanda/plugins";
initPlugins(Whanda);
```

---

## Inclusión Rápida

### En HTML
```html
<script src="whanda.min.js"></script>
<script src="whanda-plugins.min.js"></script>
```

### En JavaScript (ES Module)
```js
import { Whanda } from "whanda";
import { initPlugins } from "whanda/plugins";
initPlugins(Whanda);
```

---

## API Esencial (15 métodos para empezar)

### 1. Configurar la instancia
```js
const w = new Whanda({
  currency: "DOP",
  whatsappNumber: "1234567890",
  shipping: { type: "fixed", value: 200, freeFrom: 2000 }
});
```

### 2. Cargar productos
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

### 3. Agregar al carrito
```js
await w.addItem("1", 2);  // producto "1", cantidad 2
```

### 4. Gestionar el carrito
```js
w.getCart();              // → [{ productId, quantity, price, name }]
w.getCartItemCount();          // → número total de ítems
w.getSubtotal();               // → suma de price × quantity
w.updateQuantity("1", 3);      // cambiar cantidad
w.removeCartItem("1");         // quitar ítem
w.clearCart();                 // vaciar todo
w.hasCartItem("1");            // → true/false
```

### 5. Datos del cliente
```js
w.setCustomerName("Juan Pérez");
w.setCustomerAddress("Calle 123, Santo Domingo");
w.setCustomerNotes("Timbre azul, apartamento 4B");
```

### 6. Métodos de pago y entrega
```js
w.setPaymentMethod("Efectivo");        // o "Transferencia", "Tarjeta"
w.setDeliveryMethod("Home Delivery");  // o "In-store Pickup"
```

### 7. Crear orden
```js
const order = await w.createOrder();
// order = { id, items, subtotal, shipping, discount, total, customer, status, ... }
```

### 8. Enviar por WhatsApp
```js
const link = await w.sendToWhatsApp(order);
window.open(link, "_blank");
```

### 9. Cupones
```js
w.addCoupon({ code: "AHORRA10", amount: 10, type: "percent" });
w.addCoupon({ code: "FIJO500", amount: 500, type: "flat", minOrder: 2000 });
w.applyCoupon("AHORRA10");
w.getActiveCoupon();  // → coupon object o null
w.removeCoupon();
```

### 10. Envío
```js
w.setFixedShipping(200);           // envío fijo
w.setFreeShippingFrom(2000);      // gratis desde $2000
w.setPerItemShipping(50);         // $50 por ítem
w.getShippingCost();               // → costo calculado
w.isFreeShipping();                // → true/false
```

### 11. Temporadas
> ⚠️ Requiere whanda-plugins.min.js
```js
w.createSeason({
  id: "navidad",
  name: "Navidad 2024",
  start: "2024-12-01",
  end: "2024-12-31",
  type: "promotion",
  discount: 15
});
w.getActiveSeason();   // → season object o null
w.isInSeason("1");     // → true/false
```

### 12. Urgencia y escasez
> ⚠️ Requiere whanda-plugins.min.js
```js
w.setProductUrgency("1", {
  lowStock: 3,
  badge: "¡Solo quedan 3!"
});
w.getUrgency("1");        // → { isUrgent, isLowStock, badge, ... }
w.getLowStockProducts();  // → [{ product, urgency }]
```

### 13. Bundles
> ⚠️ Requiere whanda-plugins.min.js
```js
w.createBundle({
  id: "combo-ropa",
  name: "Combo Camisa + Pantalón",
  products: ["1", "2"],
  type: "percent",
  discount: 15
});
w.addBundle("combo-ropa", 1);  // agrega ambos productos al carrito
w.getBundles();                 // → [bundle objects]
```

### 14. CRO (Optimización de Conversión)
> ⚠️ Requiere whanda-plugins.min.js. CRO es headless — provee datos, tú renderizas la UI.
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
w.trackProductView("1");     // registrar vista
w.getRecentlyViewed();       // → [products]
```

### 15. Persistencia
```js
const saved = w.save();     // → JSON string
w.load(saved);              // restaurar desde JSON
w.reset();                  // limpiar carrito, cliente, checkout
```

---

## Estructura de Producto

```js
{
  id: "string|number",      // ID único (requerido)
  name: "string",           // Nombre (requerido)
  price: number,            // Precio (requerido)
  stock: number,            // Stock (null = ilimitado)
  category: "string",       // Categoría (requerido)
  image: "string",          // URL de imagen
  relatedIds: ["id", ...],  // Productos relacionados
  upsellIds: ["id", ...],   // Upsells (productos más caros)
  crossSellIds: ["id", ...] // Cross-sells (complementarios)
}
```

---

## Estructura de Orden

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

## Hooks Disponibles

```js
w.on("beforeAddToCart", (payload) => { /* payload: { productId, quantity } */ });
w.on("afterAddToCart", (cart) => { /* cart: items array */ });
w.on("afterCartChange", (cart) => { /* cart: items array */ });
w.on("beforeCheckout", (meta) => { /* meta: order metadata */ });
w.on("afterCheckout", (order) => { /* order: created order */ });
w.on("beforeWhatsAppSend", (order) => { /* order */ });
w.on("beforeGenerateWhatsApp", (message) => { /* message: string */ });
w.on("afterGenerateWhatsApp", (message) => { /* message: string */ });
w.on("onCartEmpty", (data) => { /* data: { items, suggestion } */ });
w.on("onRemoveItem", (data) => { /* data: { productId, cart } */ });
```

Para desuscribir: `w.off("hookName", fn)`

---

## Template de WhatsApp

```js
// Usar template personalizado
w.registerWhatsAppTemplate("minimo", (order) => {
  return `Pedido: ${order.items.map(i => i.name).join(", ")}\nTotal: $${order.total}`;
});
w.setWhatsAppTemplate("minimo");

// Templates disponibles
w.listWhatsAppTemplates();  // → ["default", "minimo"]
```

---

## Ejemplo Completo (HTML mínimo)

```html
<!DOCTYPE html>
<html>
<head><title>Tienda</title></head>
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
      `<div><h3>${p.name}</h3><p>$${p.price}</p><button onclick="w.addItem('${p.id}')">Agregar</button></div>
    `).join("");
  </script>
</body>
</html>
```

---

## Extensions

> ⚠️ Requiere whanda-extensions.min.js

```html
<script src="whanda.min.js"></script>
<script src="whanda-extensions.min.js"></script>
```

```js
w.exportOrders();  // → exportar órdenes
```

---

## Google Sheets Adapter

Carga productos desde una hoja de Google Sheets sin backend.

### Importar

```js
import { loadFromSheets, parseCSV, buildGoogleSheetsCsvUrl } from "whanda/sheets";
```

### Formato del CSV

Primera fila = headers (case-insensitive):

| Columna | Requerida | Tipo | Descripción |
|---------|-----------|------|-------------|
| `id` | Sí | string | ID único del producto |
| `name` | Sí | string | Nombre |
| `price` | Sí | number | Precio |
| `stock` | Sí | number | Stock (0 = sin stock) |
| `category` | Sí | string | Categoría |
| `image` | Sí | string | URL de imagen |
| `relatedIds` | No | string | IDs separados por comas |
| `upsellIds` | No | string | IDs separados por comas |
| `crossSellIds` | No | string | IDs separados por comas |

Ejemplo de CSV:
```
id,name,price,stock,category,image,relatedIds
1,Camisa Azul,1200,25,Ropa,camisa.jpg,2,3
2,Pantalón Negro,2500,15,Ropa,pantalon.jpg,1
```

### Carga directa (hoja pública)

```js
const w = new Whanda({ whatsappNumber: "1234567890" });

await loadFromSheets(w, {
  sheetUrl: "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=0"
});

// Productos cargados automáticamente
w.getProducts(); // → [{ id, name, price, ... }]
```

### Carga con proxy (producción)

Para no exponer la URL de la hoja:

```js
await loadFromSheets(w, {
  proxyUrl: "https://my-app.vercel.app/api/products"
});
```

El proxy debe retornar CSV (`text/csv`) o JSON:
- `{ csv: "id,name,...\n1,Camisa,..." }`
- `{ products: [{ id: "1", name: "Camisa", ... }] }`

Ver `examples/vercel-proxy/` para ejemplo completo con Vercel.

### Funciones auxiliares

```js
import { parseCSV, buildGoogleSheetsCsvUrl } from "whanda/sheets";

// Parsear CSV a productos (sin cargar en Whanda)
const products = parseCSV(csvText);

// Convertir URL de Sheets a URL de exportación CSV
const csvUrl = buildGoogleSheetsCsvUrl("https://docs.google.com/spreadsheets/d/ABC/edit?gid=0");
// → "https://docs.google.com/spreadsheets/d/ABC/export?format=csv&gid=0"
```
