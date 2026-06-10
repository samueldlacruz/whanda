# Whanda — Referencia Completa de API

Tags: `[core]` método esencial del framework, `[conv]` método de conveniencia, `[int]` método interno (puede cambiar sin aviso), `[plugin]` requiere plugin/extensión.

## whanda.js (Core)

### Constructor

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `new Whanda(config?)` | `[core]` Crear instancia. Config: `{ currency, locale, whatsappNumber, shipping, paymentMethods, deliveryMethods, currencies, regions, storeName }` | `Whanda` |

### Configuration

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getConfig()` | `[conv]` Copia de la configuración | `Object` |
| `updateConfig(partial)` | `[conv]` Fusionar config parcial | `void` |

### Hook System

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `on(hook, fn)` | `[core]` Registrar hook | `void` |
| `off(hook, fn)` | `[core]` Desregistrar hook | `void` |
| `async runHooks(hook, payload)` | `[int]` Ejecutar hooks | `Promise<*>` |

### Products

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setProducts(products)` | `[core]` Reemplazar catálogo | `void` |
| `getProducts(filter?)` | `[conv]` Productos con filtros `{ category, minPrice, maxPrice, search, sort, order, limit }` | `Object[]` |
| `getProduct(id)` | `[conv]` Producto por ID | `Object\|null` |
| `getPrice(id)` | `[conv]` Precio del producto | `number` |
| `getStock(id)` | `[conv]` Stock del producto | `number` |
| `getImages(id)` | `[conv]` Imágenes del producto | `string[]` |
| `getCategory(id)` | `[conv]` Categoría del producto | `string\|null` |
| `getCategories()` | `[conv]` Categorías únicas | `string[]` |
| `search(query)` | `[conv]` Buscar por nombre/categoría | `Object[]` |
| `filterByCategory(category)` | `[conv]` Filtrar por categoría | `Object[]` |
| `getRelatedProducts(id)` | `[conv]` Productos relacionados | `Object[]` |
| `getUpsells(id)` | `[conv]` Upsells (más caros) | `Object[]` |
| `getCrossSells(id)` | `[conv]` Cross-sells (complementarios) | `Object[]` |
| `getForCart()` | `[conv]` Recomendaciones para el carrito actual | `Object[]` |

### Cart

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getCart()` | `[conv]` Copia del carrito | `Object[]` |
| `async addItem(id, qty?)` | `[core]` Agregar al carrito (qty default: 1) | `Promise<void>` |
| `clearCart()` | `[conv]` Vaciar carrito. Dispara `onCartEmpty` | `void` |
| `removeCartItem(id)` | `[conv]` Quitar ítem. Dispara `onRemoveItem` | `void` |
| `updateQuantity(id, qty)` | `[conv]` Actualizar cantidad (0 = quitar) | `void` |
| `hasCartItem(id)` | `[conv]` Verificar si está en carrito | `boolean` |
| `getCartItemCount()` | `[conv]` Total de ítems | `number` |

### Pricing

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getSubtotal()` | `[conv]` Subtotal del carrito | `number` |
| `getShippingCost()` | `[conv]` Costo de envío calculado | `number` |
| `getDiscountAmount()` | `[conv]` Monto de descuento | `number` |
| `getTotal()` | `[conv]` Total (nunca negativo) | `number` |
| `calculate()` | `[conv]` Desglose: `{ subtotal, shipping, discount, total }` | `Object` |
| `formatPrice(amount)` | `[conv]` Formatear con moneda/locale | `string` |

### Coupons

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `addCoupon(coupon)` | `[core]` Registrar cupón | `void` |
| `getCoupons()` | `[conv]` Todos los cupones | `Object[]` |
| `validateCoupon(code)` | `[conv]` Verificar si existe | `boolean` |
| `applyCoupon(code)` | `[conv]` Aplicar cupón activo | `Object` (copia del cupón) |
| `removeCoupon()` | `[conv]` Quitar cupón activo | `void` |
| `getActiveCoupon()` | `[conv]` Cupón activo o null | `Object\|null` |

### Shipping

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getShippingMethods()` | `[conv]` Tipos disponibles | `["fixed","free","per_item"]` |
| `setShippingMethod(type)` | `[conv]` Establecer tipo | `void` |
| `isFreeShipping()` | `[conv]` ¿Envío gratis? | `boolean` |
| `getFreeShippingMin()` | `[conv]` Umbral mínimo | `number\|null` |
| `setFixedShipping(value)` | `[conv]` Envío fijo | `void` |
| `setFreeShippingFrom(n)` | `[conv]` Gratis desde n | `void` |
| `setPerItemShipping(value)` | `[conv]` Costo por ítem | `void` |

### Customer

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setCustomerName(name)` | `[conv]` Nombre del cliente | `void` |
| `setCustomerAddress(address)` | `[conv]` Dirección | `void` |
| `setCustomerNotes(notes)` | `[conv]` Notas adicionales | `void` |
| `getCustomer()` | `[conv]` Copia de datos del cliente | `Object` |

### Checkout

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getPaymentMethods()` | `[conv]` Métodos disponibles | `string[]` |
| `setPaymentMethod(method)` | `[conv]` Establecer pago | `void` |
| `getDeliveryMethods()` | `[conv]` Métodos de entrega | `string[]` |
| `setDeliveryMethod(method)` | `[conv]` Establecer entrega | `void` |
| `validateCheckout()` | `[core]` Validar datos requeridos | `true` (o lanza error) |
| `preview()` | `[core]` Vista previa de la orden | `Object` |
| `async createOrder(meta?)` | `[core]` Crear orden | `Promise<Object>` |

### Orders

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getOrder(id)` | `[conv]` Orden por ID | `Object\|null` |
| `getLastOrder()` | `[conv]` Última orden | `Object\|null` |
| `listOrders()` | `[conv]` Todas las órdenes | `Object[]` |
| `updateOrderStatus(id, status)` | `[conv]` Actualizar status | `Object` |
| `cancelOrder(id)` | `[conv]` Cancelar y eliminar | `Object` |

Status válidos: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

### Persistence

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `save()` | `[int]` Serializar estado a JSON | `string` |
| `load(json)` | `[int]` Restaurar desde JSON | `void` |
| `reset()` | `[conv]` Limpiar carrito, cliente, checkout | `void` |

### Sync

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `async sync(data)` | `[int]` Pasar por hooks before/afterSync | `Promise<*>` |

### WhatsApp

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setWhatsAppNumber(number)` | `[core]` Establecer número (7-15 dígitos) | `void` |
| `registerWhatsAppTemplate(id, fn)` | `[conv]` Registrar template | `void` |
| `setWhatsAppTemplate(id)` | `[conv]` Seleccionar template activo | `void` |
| `listWhatsAppTemplates()` | `[conv]` IDs de templates | `string[]` |
| `getWhatsAppTemplate(id)` | `[conv]` Template por ID | `Object\|null` |
| `removeWhatsAppTemplate(id)` | `[conv]` Eliminar template (no el default) | `void` |
| `previewWhatsAppTemplate(id, order)` | `[conv]` Renderizar template | `string` |
| `async generateMessage(order)` | `[int]` Generar mensaje con hooks | `Promise<string>` |
| `async generateLink(order)` | `[int]` Generar link wa.me | `Promise<string>` |
| `async sendToWhatsApp(order)` | `[core]` Generar link con beforeWhatsAppSend hook | `Promise<string>` |
| `getShareCatalogUrl(options?)` | `[conv]` URL para compartir catálogo completo por WhatsApp | `string` |
| `getThankYouHtml(options?)` | `[conv]` HTML personalizable para página de agradecimiento | `string` |

### Multi-Currency

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setCurrency(code)` | `[core]` Establecer moneda activa | `void` |
| `getCurrency()` | `[conv]` Moneda activa actual | `string` |
| `getExchangeRate(code)` | `[conv]` Tipo de cambio para una moneda | `number` |
| `convertPrice(basePrice)` | `[conv]` Convertir precio a moneda activa | `number` |
| `formatPrice(amount, code?)` | `[conv]` Formatear precio con locale | `string` |

Config: `{ currencies: { USD: 1, DOP: 56.5, EUR: 0.92 } }`

### Multi-Region

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `setRegion(code)` | `[core]` Establecer región activa (auto-setea currency) | `void` |
| `getRegion()` | `[conv]` Código de región activa | `string\|null` |
| `getTax(productId?)` | `[conv]` Tasa de impuesto (0-1) | `number` |
| `getTaxName()` | `[conv]` Nombre del impuesto (ej: "ITBIS") | `string` |
| `getRegionalShippingCost(subtotal?)` | `[conv]` Costo de envío regional | `number` |

Config: `{ regions: { DO: { tax: { rate: 0.18, name: "ITBIS" }, shipping: { flat: 150, freeFrom: 2000 }, currency: "DOP" } } }`

### Security

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `_sanitizeString(str)` | `[int]` Escapar HTML entities | `string` |
| `_sanitizeObject(obj)` | `[int]` Sanitizar recursivamente un objeto | `Object` |
| `load(jsonString)` | `[int]` Cargar estado con validación de schema | `void` |

- `load()` valida JSON y rejects keys desconocidas en config/state
- `_sanitizeString()` escapa `< > " ' &` para prevenir XSS

### Scalability

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `async loadFromSources(sources)` | `[core]` Cargar productos desde múltiples fuentes | `Promise<Object[]>` |
| `cacheProducts(ttl?)` | `[conv]` Guardar productos en cache (localStorage) | `void` |
| `loadProductsFromCache()` | `[conv]` Cargar productos desde cache | `boolean` |
| `getProductsPaginated(page, pageSize, filters?)` | `[conv]` Productos paginados | `Object` |
| `createProductIterator(batchSize?)` | `[conv]` Iterador para lazy loading | `Object` |

`getProductsPaginated()` retorna: `{ products, total, page, pageSize, totalPages, hasNext, hasPrev }`
`createProductIterator()` retorna: `{ getNextBatch(), hasMore(), reset(), getTotal(), getLoaded() }`

> **Métodos internos de caché** (uso avanzado): `_setCache(key, value, ttl)`, `_getCache(key)`, `_clearCache(key?)`. TTL en segundos.

---

## whanda-plugins.js (Plugins)

> Requiere `whanda-plugins.min.js` (IIFE) o `initPlugins(Whanda)` (ESM). Todos los métodos son `[plugin]`.

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

> Requiere `whanda-extensions.min.js` (IIFE) o `initExtensions(Whanda)` (ESM). Todos los métodos son `[plugin]`.

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `exportOrders()` | Exportar órdenes como CSV | `string` |

---

## whanda-sheets.js (Google Sheets)

> Disponible como `import { loadFromSheets } from "whanda/sheets"` (ESM) o `Whanda.loadFromSheets()` (IIFE). Todos los métodos son `[plugin]`.

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

## Error Codes (Core)

| Código | Mensaje (ES) |
|--------|-------------|
| W001 | search() requiere un texto de búsqueda |
| W002 | Producto no encontrado |
| W003 | La cantidad debe ser un número entero positivo |
| W004 | Stock insuficiente |
| W005 | La cantidad debe ser un número entero no negativo |
| W006 | Producto no encontrado en el carrito |
| W007 | El código del cupón debe ser un texto |
| W008 | Cupón inválido |
| W009 | El cupón ha expirado |
| W010 | El cupón alcanzó su límite de usos |
| W011 | Monto mínimo de orden no alcanzado |
| W012 | El valor de envío debe ser un número no negativo |
| W013 | El umbral de envío gratis debe ser un número positivo |
| W014 | El envío por ítem debe ser un número no negativo |
| W015 | Método de envío inválido |
| W016 | Método de pago inválido |
| W017 | Método de entrega inválido |
| W018 | El carrito está vacío |
| W019 | El nombre del cliente es requerido |
| W020 | La dirección del cliente es requerida |
| W021 | El método de pago es requerido |
| W022 | El método de entrega es requerido |
| W023 | Estado inválido |
| W024 | Orden no encontrada |
| W025 | Número de WhatsApp no configurado |
| W026 | El número de WhatsApp debe ser texto o número |
| W027 | El número de WhatsApp debe tener entre 7 y 15 dígitos |
| W028 | La plantilla debe ser una función |
| W029 | Plantilla no encontrada |
| W030 | No se puede eliminar la plantilla por defecto |
| W031 | El ID de la plantilla debe ser un texto no vacío |
| W032 | Plantilla activa no encontrada |
| W033 | El cupón debe tener un 'code' válido |
| W034 | El cupón debe tener un 'amount' numérico |
| W035 | setProducts() requiere un arreglo |
| W036 | debe ser un número positivo |
| W037 | Moneda no soportada |
| W038 | Región no soportada |
| W039 | Hook cancelado |
| W040 | JSON inválido en load() |
| W041 | load() espera un objeto JSON |

## Error Codes (Plugins)

| Código | Mensaje (ES) |
|--------|-------------|
| W100 | Bundle requiere id, name, y products |
| W101 | Bundle no encontrado |
| W102 | Season requiere id, name, start, y end |
| W103 | Downsell requiere un discount numérico positivo |
| W104 | Urgency requiere al menos uno de: lowStock, deadline, o badge |
| W105 | Las fechas de season deben ser válidas y start debe ser anterior a end |
| W106 | Ya existe un elemento con ese ID |
