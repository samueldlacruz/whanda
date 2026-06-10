# Whanda

**Headless Catalog + WhatsApp Checkout**

Un framework ligero para construir tiendas de productos con carrito y checkout optimizado para WhatsApp.

---

## Qué es Whanda

Whanda es un framework headless en JavaScript que permite construir catálogos de productos con carrito, pricing dinámico y checkout por WhatsApp. No es e-commerce tradicional — es un flujo de venta simplificado para mercados donde WhatsApp es el canal principal de cierre.

**Flujo:** Descubrimiento → Catálogo Web → Carrito → WhatsApp → Cierre manual

---

## Características

- **Catálogo de productos** con búsqueda, filtros y ordenamiento
- **Carrito de compras** con validación de stock en tiempo real
- **Pricing dinámico** — envío fijo, por ítem, o gratis desde umbral
- **Cupones** — monto fijo, porcentaje, expiración, límite de uso, mínimo de orden
- **Checkout completo** con métodos de pago y entrega
- **Órdenes con status** — pending, confirmed, shipped, delivered, cancelled
- **Multi-moneda** — soporte para múltiples monedas con conversión automática
- **Multi-región** — impuestos y envío por región (ej: ITBIS en DR)
- **WhatsApp** — generación de links, compartir catálogo, página de agradecimiento
- **Persistencia** — save/load para localStorage con cache TTL
- **Escalabilidad** — lazy loading, paginación, múltiples fuentes de datos
- **Seguridad** — sanitización de strings, validación de JSON, rate limiting
- **Hook system** — personalizar cualquier paso del flujo
- **Adapter Google Sheets** — cargar productos desde una hoja de cálculo
- **Zero dependencias** — un solo archivo, sin librerías externas

### Plugins opcionales
- **Temporadas** — promociones por fechas
- **Urgencia y escasez** — alertas de stock bajo, countdowns
- **Bundles** — productos agrupados con descuento
- **Downsells** — ofertas al abandonar carrito
- **CRO data** — free shipping progress, recently viewed tracking, social proof data (you render the UI)

---

## Tamaño

| Archivo | Tamaño |
|---------|--------|
| `whanda.min.js` (IIFE) | ~23 KB |
| `whanda-plugins.min.js` (plugins) | ~4 KB |
| `whanda-extensions.min.js` (extensions) | ~0.5 KB |
| `whanda.esm.min.js` (ES Module) | ~28 KB |
| Con gzip (core) | ~8-10 KB |

---

## Instalación

### Script tag (HTML)
```html
<!-- Core (~23KB) -->
<script src="whanda.min.js"></script>
<!-- Plugins opcionales (~4KB) — solo si los necesitas -->
<script src="whanda-plugins.min.js"></script>
```

### ES Module
```js
import { Whanda } from "whanda";
import { loadFromSheets } from "whanda/sheets";
import { initPlugins } from "whanda/plugins";

initPlugins(Whanda);
```

---

## Ejemplo Rápido

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

## Ejemplo 1: Tienda de Accesorios

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

## Ejemplo 2: Repostería

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

## Ejemplo 3: Tienda de Ropa

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

## Google Sheets como base de datos

Carga productos directamente desde una hoja de Google Sheets sin backend. El adapter convierte el CSV de la hoja en productos para Whanda.

### Formato del CSV

Columnas **requeridas** (en la primera fila):
```
id,name,price,stock,category,image
```

Columnas **opcionales** (se parsean de comma-separated a arrays):
```
relatedIds,upsellIds,crossSellIds
```

### Uso directo (hoja pública)

La hoja debe estar configurada como "Anyone with the link can view".

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

### Con proxy (recomendado para producción)

Para no exponer la URL de la hoja, usa un proxy serverless. Ver `examples/vercel-proxy/` para un ejemplo con Vercel.

```js
await loadFromSheets(w, {
  proxyUrl: "https://my-app.vercel.app/api/products"
});
```

El proxy debe retornar:
- CSV con content-type `text/csv`, o
- JSON con `{ csv: "..." }` o `{ products: [...] }`

---

## Generar Tienda con AI Agent / Vibecoding

Copia este prompt y pégalo en tu agente de IA favorito:

> **Prompt:**
>
> Usando whanda.min.js + whanda-plugins.min.js, crea una tienda de [ACCESORIOS / REPOSTERÍA / ROPA / ELECTRÓNICA / OTRO].
>
> **Flujo:** Catálogo → Carrito → WhatsApp → Cierre manual (sin backend ni pasarela de pago).
>
> **Requisitos técnicos:**
> 1. Incluir `<script src="whanda.min.js">` + `<script src="whanda-plugins.min.js">`
> 2. Instancia: `new Whanda({ whatsappNumber: "NUM", shipping: { type: "fixed", value: X, freeFrom: Y } })`
> 3. Productos: `w.setProducts([{ id, name, price, stock, category, image }])`
> 4. Carrito: `await w.addItem(id)`, `w.getCart()`, `w.updateQuantity(id, qty)`
> 5. Checkout: `w.setCustomerName()`, `w.setCustomerAddress()`, `w.setPaymentMethod()`, `w.setDeliveryMethod()`
> 6. WhatsApp: `const order = await w.createOrder(); window.open(await w.sendToWhatsApp(order))`
> 7. CRO (plugins): `w.setCRO({ freeShippingBar: true, freeShippingGoal: Y })` para barra de progreso
> 8. Urgencia (plugins): `w.setProductUrgency(id, { lowStock: N, badge: "..." })` para alertas de stock
> 9. Cupón: `w.addCoupon({ code: "X", amount: N, type: "percent" })`
> 10. Diseño responsive con Tailwind CSS
>
> **Estructura mínima:**
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
> El archivo whanda.min.js y whanda-plugins.min.js ya están en el proyecto.

---

## API Rápida

| Método | Descripción |
|--------|-------------|
| `new Whanda(config)` | Crear instancia |
| `setProducts(products)` | Cargar catálogo |
| `getProducts(filter)` | Obtener productos con filtros |
| `addItem(id, qty)` | Agregar al carrito |
| `getCart()` | Obtener items del carrito |
| `getRelatedProducts(id)` | Obtener productos relacionados |
| `generateLink(order)` | Generar link de WhatsApp |
| `generateMessage(order)` | Generar mensaje de WhatsApp |
| `createOrder()` | Crear orden |
| `sendToWhatsApp(order)` | Generar link de WhatsApp |
| `addCoupon(config)` * | Registrar cupón |
| `applyCoupon(code)` | Aplicar cupón |
| `setFixedShipping(value)` | Envío fijo |
| `setFreeShippingFrom(n)` | Envío gratis desde |
| `createSeason(config)` * | Crear temporada |
| `setProductUrgency(id, c)` * | Configurar urgencia |
| `createBundle(config)` * | Crear bundle |
| `addBundle(id)` * | Agregar bundle al carrito |
| `setCRO(config)` * | Configurar CRO |
| `save() / load(json)` | Persistencia |

\* Requiere whanda-plugins.min.js

---

## Documentación Completa

- [DOC.md](./DOC.md) — Referencia completa de todos los métodos
- [USAGE.md](./USAGE.md) — Guía completa para AI agents y desarrolladores
- [JSDoc](./src/whanda.js) — Documentación inline en el código fuente

---

## Licencia

MIT
