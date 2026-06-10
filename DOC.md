# Whanda — Referencia Completa de API

## whanda.js (Core)

### Constructor

| Método | Descripción |
|--------|-------------|
| `new Whanda(config?)` | Crear instancia. Config: `{ currency, locale, whatsappNumber, shipping, paymentMethods, deliveryMethods, currencies, regions, storeName }` |

### Configuration

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getConfig()` | Copia de la configuración | `Object` |
| `updateConfig(partial)` | Fusionar config parcial | `void` |

### Hook System

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `on(hook, fn)` | Registrar hook | `void` |
| `off(hook, fn)` | Desregistrar hook | `void` |
| `async runHooks(hook, payload)` | Ejecutar hooks | `Promise<*>` |

### Products

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setProducts(products)` | Reemplazar catálogo | `void` |
| `getProducts(filter?)` | Productos con filtros `{ category, minPrice, maxPrice, search, sort, order, limit }` | `Object[]` |
| `getProduct(id)` | Producto por ID | `Object\|null` |
| `getPrice(id)` | Precio del producto | `number` |
| `getStock(id)` | Stock del producto | `number` |
| `getImages(id)` | Imágenes del producto | `string[]` |
| `getCategory(id)` | Categoría del producto | `string\|null` |
| `getCategories()` | Categorías únicas | `string[]` |
| `search(query)` | Buscar por nombre/categoría | `Object[]` |
| `filterByCategory(category)` | Filtrar por categoría | `Object[]` |
| `getRelatedProducts(id)` | Productos relacionados | `Object[]` |
| `getUpsells(id)` | Upsells (más caros) | `Object[]` |
| `getCrossSells(id)` | Cross-sells (complementarios) | `Object[]` |
| `getForCart()` | Recomendaciones para el carrito actual | `Object[]` |

### Cart

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getCart()` | Copia del carrito | `Object[]` |
| `async addItem(id, qty?)` | Agregar al carrito (qty default: 1) | `Promise<void>` |
| `clearCart()` | Vaciar carrito. Dispara `onCartEmpty` | `void` |
| `removeCartItem(id)` | Quitar ítem. Dispara `onRemoveItem` | `void` |
| `updateQuantity(id, qty)` | Actualizar cantidad (0 = quitar) | `void` |
| `hasCartItem(id)` | Verificar si está en carrito | `boolean` |
| `getCartItemCount()` | Total de ítems | `number` |

### Pricing

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getSubtotal()` | Subtotal del carrito | `number` |
| `getShippingCost()` | Costo de envío calculado | `number` |
| `getDiscountAmount()` | Monto de descuento | `number` |
| `getTotal()` | Total (nunca negativo) | `number` |
| `calculate()` | Desglose: `{ subtotal, shipping, discount, total }` | `Object` |
| `formatPrice(amount)` | Formatear con moneda/locale | `string` |

### Coupons

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `addCoupon(coupon)` | Registrar cupón | `void` |
| `getCoupons()` | Todos los cupones | `Object[]` |
| `validateCoupon(code)` | Verificar si existe | `boolean` |
| `applyCoupon(code)` | Aplicar cupón activo | `Object` (copia del cupón) |
| `removeCoupon()` | Quitar cupón activo | `void` |
| `getActiveCoupon()` | Cupón activo o null | `Object\|null` |

### Shipping

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getShippingMethods()` | Tipos disponibles | `["fixed","free","per_item"]` |
| `setShippingMethod(type)` | Establecer tipo | `void` |
| `isFreeShipping()` | ¿Envío gratis? | `boolean` |
| `getFreeShippingMin()` | Umbral mínimo | `number\|null` |
| `setFixedShipping(value)` | Envío fijo | `void` |
| `setFreeShippingFrom(n)` | Gratis desde n | `void` |
| `setPerItemShipping(value)` | Costo por ítem | `void` |

### Customer

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setCustomerName(name)` | Nombre del cliente | `void` |
| `setCustomerAddress(address)` | Dirección | `void` |
| `setCustomerNotes(notes)` | Notas adicionales | `void` |
| `getCustomer()` | Copia de datos del cliente | `Object` |

### Checkout

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getPaymentMethods()` | Métodos disponibles | `string[]` |
| `setPaymentMethod(method)` | Establecer pago | `void` |
| `getDeliveryMethods()` | Métodos de entrega | `string[]` |
| `setDeliveryMethod(method)` | Establecer entrega | `void` |
| `validateCheckout()` | Validar datos requeridos | `true` (o lanza error) |
| `preview()` | Vista previa de la orden | `Object` |
| `async createOrder(meta?)` | Crear orden | `Promise<Object>` |

### Orders

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getOrder(id)` | Orden por ID | `Object\|null` |
| `getLastOrder()` | Última orden | `Object\|null` |
| `listOrders()` | Todas las órdenes | `Object[]` |
| `updateOrderStatus(id, status)` | Actualizar status | `Object` |
| `cancelOrder(id)` | Cancelar y eliminar | `Object` |

Status válidos: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

### Persistence

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `save()` | Serializar estado a JSON | `string` |
| `load(json)` | Restaurar desde JSON | `void` |
| `reset()` | Limpiar carrito, cliente, checkout | `void` |

### Sync

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `async sync(data)` | Pasar por hooks before/afterSync | `Promise<*>` |

### WhatsApp

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setWhatsAppNumber(number)` | Establecer número (7-15 dígitos) | `void` |
| `registerWhatsAppTemplate(id, fn)` | Registrar template | `void` |
| `setWhatsAppTemplate(id)` | Seleccionar template activo | `void` |
| `listWhatsAppTemplates()` | IDs de templates | `string[]` |
| `getWhatsAppTemplate(id)` | Template por ID | `Object\|null` |
| `removeWhatsAppTemplate(id)` | Eliminar template (no el default) | `void` |
| `previewWhatsAppTemplate(id, order)` | Renderizar template | `string` |
| `async generateMessage(order)` | Generar mensaje con hooks | `Promise<string>` |
| `async generateLink(order)` | Generar link wa.me | `Promise<string>` |
| `async sendToWhatsApp(order)` | Generar link con beforeWhatsAppSend hook | `Promise<string>` |
| `getShareCatalogUrl(options?)` | URL para compartir catálogo completo por WhatsApp | `string` |
| `getThankYouHtml(options?)` | HTML personalizable para página de agradecimiento | `string` |

### Multi-Currency

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setCurrency(code)` | Establecer moneda activa | `void` |
| `getCurrency()` | Moneda activa actual | `string` |
| `getExchangeRate(code)` | Tipo de cambio para una moneda | `number` |
| `convertPrice(basePrice)` | Convertir precio a moneda activa | `number` |
| `formatPrice(amount, code?)` | Formatear precio con locale | `string` |

Config: `{ currencies: { USD: 1, DOP: 56.5, EUR: 0.92 } }`

### Multi-Region

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setRegion(code)` | Establecer región activa (auto-setea currency) | `void` |
| `getRegion()` | Código de región activa | `string\|null` |
| `getTax(productId?)` | Tasa de impuesto (0-1) | `number` |
| `getTaxName()` | Nombre del impuesto (ej: "ITBIS") | `string` |
| `getRegionalShippingCost(subtotal?)` | Costo de envío regional | `number` |

Config: `{ regions: { DO: { tax: { rate: 0.18, name: "ITBIS" }, shipping: { flat: 150, freeFrom: 2000 }, currency: "DOP" } } }`

### Security

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `_sanitizeString(str)` | Escapar HTML entities | `string` |
| `_sanitizeObject(obj)` | Sanitizar recursivamente un objeto | `Object` |
| `load(jsonString)` | Cargar estado con validación de schema | `void` |

- `load()` valida JSON y rejects keys desconocidas en config/state
- `_sanitizeString()` escapa `< > " ' &` para prevenir XSS

### Scalability

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `async loadFromSources(sources)` | Cargar productos desde múltiples fuentes | `Promise<Object[]>` |
| `cacheProducts(ttl?)` | Guardar productos en cache (localStorage) | `void` |
| `loadProductsFromCache()` | Cargar productos desde cache | `boolean` |
| `getProductsPaginated(page, pageSize, filters?)` | Productos paginados | `Object` |
| `createProductIterator(batchSize?)` | Iterador para lazy loading | `Object` |

`getProductsPaginated()` retorna: `{ products, total, page, pageSize, totalPages, hasNext, hasPrev }`
`createProductIterator()` retorna: `{ getNextBatch(), hasMore(), reset(), getTotal(), getLoaded() }`

---

## whanda-plugins.js (Plugins)

> Requiere `whanda-plugins.min.js` (IIFE) o `initPlugins(Whanda)` (ESM).

### Downsells

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setDownsell(config)` | Configurar downsell `{ trigger, type, value, message, alternativeProductId }` | `void` |
| `getDownsell()` | Config actual | `Object\|null` |
| `clearDownsell()` | Quitar downsell | `void` |

### Seasons

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `createSeason(config)` | Crear temporada `{ id, name, start, end, type, discount, products, couponCode }` | `void` |
| `getSeasons()` | Todas las temporadas | `Object[]` |
| `getActiveSeason()` | Temporada activa por fecha | `Object\|null` |
| `isInSeason(productId)` | ¿Producto en temporada? | `boolean` |
| `removeSeason(id)` | Eliminar temporada | `void` |

### Urgency

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setProductUrgency(id, config)` | Configurar urgencia `{ lowStock, countdown, badge }` | `void` |
| `getUrgency(id)` | Datos de urgencia con campos computados | `Object\|null` |
| `clearProductUrgency(id)` | Quitar urgencia | `void` |
| `getLowStockProducts()` | Productos con stock bajo | `Object[]` |

### Bundles

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `createBundle(config)` | Crear bundle `{ id, name, products, type, discount }` | `void` |
| `getBundles()` | Todos los bundles | `Object[]` |
| `getBundle(id)` | Bundle por ID | `Object\|null` |
| `async addBundle(id, qty?)` | Agregar bundle al carrito | `Promise<void>` |
| `removeBundle(id)` | Quitar bundle del carrito | `void` |
| `deleteBundle(id)` | Eliminar bundle | `void` |

`products` acepta: `["id1", "id2"]` o `[{ productId: "id1", quantity: 1 }]`

### CRO (Headless)

> CRO es headless — provee datos, tú renderizas la UI.

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setCRO(config)` | Configurar CRO `{ freeShippingBar, freeShippingGoal, lowStockAlert, recentlyViewed, socialProof, exitIntent, exitMessage, exitDiscount }` | `void` |
| `getCROData()` | Todos los datos CRO | `Object` |
| `trackProductView(id)` | Registrar vista de producto | `void` |
| `getRecentlyViewed()` | Productos vistos recientemente | `Object[]` |
| `getSocialProof(id)` | Datos de prueba social | `Object\|null` |
| `checkFreeShippingProgress()` | Progreso de envío gratis | `{ current, goal, remaining, qualifies, progress }` |

---

## whanda-extensions.js (Extensions)

> Requiere `whanda-extensions.min.js` (IIFE) o `initExtensions(Whanda)` (ESM).

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `exportOrders()` | Exportar órdenes como CSV | `string` |

---

## whanda-sheets.js (Google Sheets)

> Disponible como `import { loadFromSheets } from "whanda/sheets"` (ESM) o `Whanda.loadFromSheets()` (IIFE).

| Función | Descripción | Retorna |
|---------|-------------|---------|
| `async loadFromSheets(whanda, options)` | Cargar productos desde Google Sheets | `Promise<Object[]>` |
| `parseCSV(text)` | Parsear CSV a productos | `Object[]` |
| `buildGoogleSheetsCsvUrl(url)` | Convertir URL de Sheets a CSV export | `string` |

Options para `loadFromSheets`:
- `sheetUrl` — URL de Google Sheets (hoja pública)
- `proxyUrl` — URL de proxy serverless (recomendado para producción)

---

## Hooks

| Hook | Payload | Cuándo se dispara |
|------|---------|-------------------|
| `beforeAddToCart` | `{ productId, quantity }` | Antes de agregar ítem |
| `afterAddToCart` | `cart items` | Después de agregar ítem |
| `afterCartChange` | `cart items` | Después de cualquier cambio de carrito |
| `beforeCheckout` | `meta` | Antes de crear orden |
| `afterCheckout` | `order` | Después de crear orden |
| `beforeWhatsAppSend` | `order` | Antes de generar link |
| `beforeGenerateWhatsApp` | `message` | Antes de renderizar template |
| `afterGenerateWhatsApp` | `message` | Después de renderizar template |
| `onRemoveItem` | `{ productId, cart }` | Al quitar ítem del carrito |
| `onCartEmpty` | `{ cart }` | Al vaciar el carrito |
| `beforeSync` | `data` | Antes de sync |
| `afterSync` | `data` | Después de sync |

Hooks pueden abortar retornando `{ abort: true, message: "..." }`.

---

## Error Codes

| Código | Mensaje |
|--------|---------|
| W001 | search() requires a string |
| W002 | Product not found |
| W003 | quantity must be a positive integer |
| W004 | Insufficient stock |
| W005 | quantity must be a non-negative integer |
| W006 | Product not found in cart |
| W007 | Coupon code must be a string |
| W008 | Invalid coupon code |
| W009 | Coupon has expired |
| W010 | Coupon usage limit reached |
| W011 | Minimum order amount |
| W012 | Shipping value must be a non-negative number |
| W013 | Free shipping threshold must be a positive number |
| W014 | Per-item shipping value must be a non-negative number |
| W015 | Invalid shipping method |
| W016 | Invalid payment method |
| W017 | Invalid delivery method |
| W018 | Cart is empty |
| W019 | Customer name is required |
| W020 | Customer address is required |
| W021 | Payment method is required |
| W022 | Delivery method is required |
| W023 | Invalid status |
| W024 | Order not found |
| W025 | WhatsApp number not set |
| W026 | WhatsApp number must be a string or number |
| W027 | WhatsApp number must be between 7 and 15 digits |
| W028 | Template must be a function |
| W029 | Template not found |
| W030 | Cannot remove the default template |
| W031 | Template id must be a non-empty string |
| W032 | Active template not found |
| W033 | Coupon must have a valid 'code' string |
| W034 | Coupon must have a valid 'amount' number |
| W035 | setProducts() requires an array |
| W036 | Bundle requires id, name, and products |
| W037 | Bundle not found |
| W038 | Season requires id, name, start, and end |
