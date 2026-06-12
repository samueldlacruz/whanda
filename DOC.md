# Whanda — Complete API Reference

Tags: `[core]` essential framework method, `[conv]` convenience method, `[int]` internal method (may change without notice), `[plugin]` requires plugin/extension.

## whanda.js (Core)

### Constructor

| Method | Description | Returns |
|--------|-------------|---------|
| `new Whanda(config?)` | `[core]` Create instance. Config: `{ currency, locale, whatsappNumber, shipping, paymentMethods, deliveryMethods, currencies, regions, storeName }` | `Whanda` |

### Configuration

| Method | Description | Returns |
|--------|-------------|---------|
| `getConfig()` | `[conv]` Copy of the configuration | `Object` |
| `updateConfig(partial)` | `[conv]` Merge partial config | `void` |

### Hook System

| Method | Description | Returns |
|--------|-------------|---------|
| `on(hook, fn)` | `[core]` Register hook | `void` |
| `off(hook, fn)` | `[core]` Unregister hook | `void` |
| `async runHooks(hook, payload)` | `[int]` Run hooks | `Promise<*>` |

### Products

| Method | Description | Returns |
|--------|-------------|---------|
| `setProducts(products)` | `[core]` Replace catalog | `void` |
| `getProducts(filter?)` | `[conv]` Products with filters `{ category, minPrice, maxPrice, search, sort, order, limit }` | `Object[]` |
| `getProduct(id)` | `[conv]` Product by ID | `Object\|null` |
| `getPrice(id)` | `[conv]` Product price | `number` |
| `getStock(id)` | `[conv]` Product stock | `number` |
| `getImages(id)` | `[conv]` Product images | `string[]` |
| `getCategory(id)` | `[conv]` Product category | `string\|null` |
| `getCategories()` | `[conv]` Unique categories | `string[]` |
| `search(query)` | `[conv]` Search by name/category | `Object[]` |
| `filterByCategory(category)` | `[conv]` Filter by category | `Object[]` |
| `getRelatedProducts(id)` | `[conv]` Related products | `Object[]` |
| `getUpsells(id)` | `[conv]` Upsells (more expensive) | `Object[]` |
| `getCrossSells(id)` | `[conv]` Cross-sells (complementary) | `Object[]` |
| `getForCart()` | `[conv]` Recommendations for current cart | `Object[]` |

### Cart

| Method | Description | Returns |
|--------|-------------|---------|
| `getCart()` | `[conv]` Copy of cart | `Object[]` |
| `async addItem(id, qty?)` | `[core]` Add to cart (qty default: 1) | `Promise<void>` |
| `clearCart()` | `[conv]` Empty cart. Fires `onCartEmpty` | `void` |
| `removeCartItem(id)` | `[conv]` Remove item. Fires `onRemoveItem` | `void` |
| `updateQuantity(id, qty)` | `[conv]` Update quantity (0 = remove) | `void` |
| `hasCartItem(id)` | `[conv]` Check if in cart | `boolean` |
| `getCartItemCount()` | `[conv]` Total items | `number` |

### Pricing

| Method | Description | Returns |
|--------|-------------|---------|
| `getSubtotal()` | `[conv]` Cart subtotal | `number` |
| `getShippingCost()` | `[conv]` Calculated shipping cost | `number` |
| `getDiscountAmount()` | `[conv]` Discount amount | `number` |
| `getTotal()` | `[conv]` Total (never negative) | `number` |
| `calculate()` | `[conv]` Breakdown: `{ subtotal, shipping, discount, total }` | `Object` |
| `formatPrice(amount)` | `[conv]` Format with currency/locale | `string` |

### Coupons

| Method | Description | Returns |
|--------|-------------|---------|
| `addCoupon(coupon)` | `[core]` Register coupon | `void` |
| `getCoupons()` | `[conv]` All coupons | `Object[]` |
| `validateCoupon(code)` | `[conv]` Check if exists | `boolean` |
| `applyCoupon(code)` | `[conv]` Apply active coupon | `Object` (copy of coupon) |
| `removeCoupon()` | `[conv]` Remove active coupon | `void` |
| `getActiveCoupon()` | `[conv]` Active coupon or null | `Object\|null` |

### Shipping

| Method | Description | Returns |
|--------|-------------|---------|
| `getShippingMethods()` | `[conv]` Available types | `["fixed","free","per_item"]` |
| `setShippingMethod(type)` | `[conv]` Set type | `void` |
| `isFreeShipping()` | `[conv]` Free shipping? | `boolean` |
| `getFreeShippingMin()` | `[conv]` Minimum threshold | `number\|null` |
| `setFixedShipping(value)` | `[conv]` Fixed shipping | `void` |
| `setFreeShippingFrom(n)` | `[conv]` Free from n | `void` |
| `setPerItemShipping(value)` | `[conv]` Per-item cost | `void` |

### Customer

| Method | Description | Returns |
|--------|-------------|---------|
| `setCustomerName(name)` | `[conv]` Customer name | `void` |
| `setCustomerAddress(address)` | `[conv]` Address | `void` |
| `setCustomerNotes(notes)` | `[conv]` Additional notes | `void` |
| `getCustomer()` | `[conv]` Copy of customer data | `Object` |

### Checkout

| Method | Description | Returns |
|--------|-------------|---------|
| `getPaymentMethods()` | `[conv]` Available methods | `string[]` |
| `setPaymentMethod(method)` | `[conv]` Set payment | `void` |
| `getDeliveryMethods()` | `[conv]` Delivery methods | `string[]` |
| `setDeliveryMethod(method)` | `[conv]` Set delivery | `void` |
| `validateCheckout()` | `[core]` Validate required data | `true` (or throws error) |
| `preview()` | `[core]` Order preview | `Object` |
| `async createOrder(meta?)` | `[core]` Create order | `Promise<Object>` |

### Orders

| Method | Description | Returns |
|--------|-------------|---------|
| `getOrder(id)` | `[conv]` Order by ID | `Object\|null` |
| `getLastOrder()` | `[conv]` Last order | `Object\|null` |
| `listOrders()` | `[conv]` All orders | `Object[]` |
| `updateOrderStatus(id, status)` | `[conv]` Update status | `Object` |
| `cancelOrder(id)` | `[conv]` Cancel and remove | `Object` |

Valid statuses: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

### Persistence

| Method | Description | Returns |
|--------|-------------|---------|
| `save()` | `[int]` Serialize state to JSON | `string` |
| `load(json)` | `[int]` Restore from JSON | `void` |
| `reset()` | `[conv]` Clear cart, customer, checkout | `void` |

### Sync

| Method | Description | Returns |
|--------|-------------|---------|
| `async sync(data)` | `[int]` Pass through before/afterSync hooks | `Promise<*>` |

### WhatsApp

| Method | Description | Returns |
|--------|-------------|---------|
| `setWhatsAppNumber(number)` | `[core]` Set number (7-15 digits) | `void` |
| `registerWhatsAppTemplate(id, fn)` | `[conv]` Register template | `void` |
| `setWhatsAppTemplate(id)` | `[conv]` Select active template | `void` |
| `listWhatsAppTemplates()` | `[conv]` Template IDs | `string[]` |
| `getWhatsAppTemplate(id)` | `[conv]` Template by ID | `Object\|null` |
| `removeWhatsAppTemplate(id)` | `[conv]` Delete template (not the default) | `void` |
| `previewWhatsAppTemplate(id, order)` | `[conv]` Render template | `string` |
| `async generateMessage(order)` | `[int]` Generate message with hooks | `Promise<string>` |
| `async generateLink(order)` | `[int]` Generate wa.me link | `Promise<string>` |
| `async sendToWhatsApp(order)` | `[core]` Generate link with beforeWhatsAppSend hook | `Promise<string>` |
| `getShareCatalogUrl(options?)` | `[conv]` URL to share full catalog via WhatsApp | `string` |
| `getThankYouHtml(options?)` | `[conv]` Customizable HTML for thank-you page | `string` |

### Multi-Currency

| Method | Description | Returns |
|--------|-------------|---------|
| `setCurrency(code)` | `[core]` Set active currency | `void` |
| `getCurrency()` | `[conv]` Current active currency | `string` |
| `getExchangeRate(code)` | `[conv]` Exchange rate for a currency | `number` |
| `convertPrice(basePrice)` | `[conv]` Convert price to active currency | `number` |
| `formatPrice(amount, code?)` | `[conv]` Format price with locale | `string` |

Config: `{ currencies: { USD: 1, DOP: 56.5, EUR: 0.92 } }`

### Multi-Region

| Method | Description | Returns |
|--------|-------------|---------|
| `setRegion(code)` | `[core]` Set active region (auto-sets currency) | `void` |
| `getRegion()` | `[conv]` Active region code | `string\|null` |
| `getTax(productId?)` | `[conv]` Tax rate (0-1) | `number` |
| `getTaxName()` | `[conv]` Tax name (e.g. "ITBIS") | `string` |
| `getRegionalShippingCost(subtotal?)` | `[conv]` Regional shipping cost | `number` |

Config: `{ regions: { DO: { tax: { rate: 0.18, name: "ITBIS" }, shipping: { flat: 150, freeFrom: 2000 }, currency: "DOP" } } }`

### Security

| Method | Description | Returns |
|--------|-------------|---------|
| `_sanitizeString(str)` | `[int]` Escape HTML entities | `string` |
| `_sanitizeObject(obj)` | `[int]` Recursively sanitize an object | `Object` |
| `load(jsonString)` | `[int]` Load state with schema validation | `void` |

- `load()` validates JSON and rejects unknown keys in config/state
- `_sanitizeString()` escapes `< > " ' &` to prevent XSS

### Scalability

| Method | Description | Returns |
|--------|-------------|---------|
| `async loadFromSources(sources)` | `[core]` Load products from multiple sources | `Promise<Object[]>` |
| `cacheProducts(ttl?)` | `[conv]` Cache products (localStorage) | `void` |
| `loadProductsFromCache()` | `[conv]` Load products from cache | `boolean` |
| `getProductsPaginated(page, pageSize, filters?)` | `[conv]` Paginated products | `Object` |
| `createProductIterator(batchSize?)` | `[conv]` Iterator for lazy loading | `Object` |

`getProductsPaginated()` returns: `{ products, total, page, pageSize, totalPages, hasNext, hasPrev }`
`createProductIterator()` returns: `{ getNextBatch(), hasMore(), reset(), getTotal(), getLoaded() }`

> **Internal cache methods** (advanced usage): `_setCache(key, value, ttl)`, `_getCache(key)`, `_clearCache(key?)`. TTL in seconds.

---

## whanda-plugins.js (Plugins)

> Requires `whanda-plugins.min.js` (IIFE) or `initPlugins(Whanda)` (ESM). All methods are `[plugin]`.

### Downsells

| Method | Description | Returns |
|--------|-------------|---------|
| `setDownsell(config)` | Configure downsell `{ trigger, type, value, message, alternativeProductId }` | `void` |
| `getDownsell()` | Current config | `Object\|null` |
| `clearDownsell()` | Remove downsell | `void` |

### Seasons

| Method | Description | Returns |
|--------|-------------|---------|
| `createSeason(config)` | Create season `{ id, name, start, end, type, discount, products, couponCode }` | `void` |
| `getSeasons()` | All seasons | `Object[]` |
| `getActiveSeason()` | Active season by date | `Object\|null` |
| `isInSeason(productId)` | Product in season? | `boolean` |
| `removeSeason(id)` | Remove season | `void` |

### Urgency

| Method | Description | Returns |
|--------|-------------|---------|
| `setProductUrgency(id, config)` | Configure urgency `{ lowStock, countdown, badge }` | `void` |
| `getUrgency(id)` | Urgency data with computed fields | `Object\|null` |
| `clearProductUrgency(id)` | Remove urgency | `void` |
| `getLowStockProducts()` | Low stock products | `Object[]` |

### Bundles

| Method | Description | Returns |
|--------|-------------|---------|
| `createBundle(config)` | Create bundle `{ id, name, products, type, discount }` | `void` |
| `getBundles()` | All bundles | `Object[]` |
| `getBundle(id)` | Bundle by ID | `Object\|null` |
| `async addBundle(id, qty?)` | Add bundle to cart | `Promise<void>` |
| `removeBundle(id)` | Remove bundle from cart | `void` |
| `deleteBundle(id)` | Delete bundle | `void` |

`products` accepts: `["id1", "id2"]` or `[{ productId: "id1", quantity: 1 }]`

### CRO (Headless)

> CRO is headless — it provides data, you render the UI.

| Method | Description | Returns |
|--------|-------------|---------|
| `setCRO(config)` | Configure CRO `{ freeShippingBar, freeShippingGoal, lowStockAlert, recentlyViewed, socialProof, exitIntent, exitMessage, exitDiscount }` | `void` |
| `getCROData()` | All CRO data | `Object` |
| `trackProductView(id)` | Track product view | `void` |
| `getRecentlyViewed()` | Recently viewed products | `Object[]` |
| `getSocialProof(id)` | Social proof data | `Object\|null` |
| `checkFreeShippingProgress()` | Free shipping progress | `{ current, goal, remaining, qualifies, progress }` |

---

## whanda-extensions.js (Extensions)

> Requires `whanda-extensions.min.js` (IIFE) or `initExtensions(Whanda)` (ESM). All methods are `[plugin]`.

| Method | Description | Returns |
|--------|-------------|---------|
| `exportOrders()` | Export orders as CSV | `string` |

---

## whanda-sheets.js (Google Sheets)

> Available as `import { loadFromSheets } from "whanda/sheets"` (ESM) or `Whanda.loadFromSheets()` (IIFE). All methods are `[plugin]`.

| Function | Description | Returns |
|----------|-------------|---------|
| `async loadFromSheets(whanda, options)` | Load products from Google Sheets | `Promise<Object[]>` |
| `parseCSV(text)` | Parse CSV to products | `Object[]` |
| `buildGoogleSheetsCsvUrl(url)` | Convert Sheets URL to CSV export | `string` |

Options for `loadFromSheets`:
- `sheetUrl` — Google Sheets URL (public sheet)
- `proxyUrl` — Serverless proxy URL (recommended for production)

---

## Hooks

| Hook | Payload | Fires when |
|------|---------|------------|
| `beforeAddToCart` | `{ productId, quantity }` | Before adding item |
| `afterAddToCart` | `cart items` | After adding item |
| `afterCartChange` | `cart items` | After any cart change |
| `beforeCheckout` | `meta` | Before creating order |
| `afterCheckout` | `order` | After creating order |
| `beforeWhatsAppSend` | `order` | Before generating link |
| `beforeGenerateWhatsApp` | `message` | Before rendering template |
| `afterGenerateWhatsApp` | `message` | After rendering template |
| `onRemoveItem` | `{ productId, cart }` | When removing item from cart |
| `onCartEmpty` | `{ cart }` | When emptying cart |
| `beforeSync` | `data` | Before sync |
| `afterSync` | `data` | After sync |

Hooks can abort by returning `{ abort: true, message: "..." }`.

---

## Error Codes (Core)

| Code | Message |
|------|---------|
| W001 | search() requires search text |
| W002 | Product not found |
| W003 | Quantity must be a positive integer |
| W004 | Insufficient stock |
| W005 | Quantity must be a non-negative integer |
| W006 | Product not found in cart |
| W007 | Coupon code must be a string |
| W008 | Invalid coupon |
| W009 | Coupon has expired |
| W010 | Coupon reached its usage limit |
| W011 | Minimum order amount not reached |
| W012 | Shipping value must be a non-negative number |
| W013 | Free shipping threshold must be a positive number |
| W014 | Per-item shipping must be a non-negative number |
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
| W025 | WhatsApp number not configured |
| W026 | WhatsApp number must be a string or number |
| W027 | WhatsApp number must be between 7 and 15 digits |
| W028 | Template must be a function |
| W029 | Template not found |
| W030 | Cannot delete the default template |
| W031 | Template ID must be a non-empty string |
| W032 | Active template not found |
| W033 | Coupon must have a valid 'code' |
| W034 | Coupon must have a numeric 'amount' |
| W035 | setProducts() requires an array |
| W036 | must be a positive number |
| W037 | Unsupported currency |
| W038 | Unsupported region |
| W039 | Hook cancelled |
| W040 | Invalid JSON in load() |
| W041 | load() expects a JSON object |

## Error Codes (Plugins)

| Code | Message |
|------|---------|
| W100 | Bundle requires id, name, and products |
| W101 | Bundle not found |
| W102 | Season requires id, name, start, and end |
| W103 | Downsell requires a positive numeric discount |
| W104 | Urgency requires at least one of: lowStock, deadline, or badge |
| W105 | Season dates must be valid and start must be before end |
| W106 | Element with that ID already exists |
