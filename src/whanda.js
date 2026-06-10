// ================================
// WHANDA CORE FRAMEWORK
// Headless Catalog + WhatsApp Checkout
// ================================

import { ERR } from "./err.js";
import { deepMerge, initHelpers } from "./helpers.js";
import { initConfig } from "./config.js";
import { initCurrency } from "./currency.js";
import { initRegion } from "./region.js";
import { initHooks } from "./hooks.js";
import { initProducts } from "./products.js";
import { initCart } from "./cart.js";
import { initPricing } from "./pricing.js";
import { initCoupons } from "./coupons.js";
import { initShipping } from "./shipping.js";
import { initCustomer } from "./customer.js";
import { initCheckout } from "./checkout.js";
import { initOrders } from "./orders.js";
import { initPersistence } from "./persistence.js";
import { initSync } from "./sync.js";
import { initScalability } from "./scalability.js";
import { initWhatsApp } from "./whatsapp.js";

/**
 * Headless e-commerce framework for building product catalogs
 * with cart, dynamic pricing, and WhatsApp-optimized checkout.
 *
 * Flow: Discovery → Catalog → Cart → WhatsApp → Manual close
 *
 * @example
 * const whanda = new Whanda({ currency: "DOP" });
 * whanda.setProducts([...]);
 * await whanda.addItem("123");
 * whanda.setCustomerName("Juan");
 * const link = await whanda.sendToWhatsApp(order);
 */
export class Whanda {
  /**
   * Creates a new Whanda instance.
   *
   * @param {Object} [config={}] - Configuration options
   * @param {string} [config.currency="DOP"] - ISO 4217 currency code
   * @param {string} [config.locale="es-DO"] - Locale for formatting (e.g., "es-DO", "en-US")
   * @param {string|null} [config.whatsappNumber=null] - WhatsApp phone number (digits only)
   * @param {Object} [config.shipping] - Shipping configuration
   * @param {string} [config.shipping.type="fixed"] - Shipping type: "fixed", "free", or "per_item"
   * @param {number} [config.shipping.value=0] - Fixed shipping cost
   * @param {number|null} [config.shipping.freeFrom=null] - Minimum subtotal for free shipping
   * @param {number} [config.shipping.perItem=0] - Cost per item for per_item shipping
   * @param {string[]} [config.paymentMethods=["Cash","Bank Transfer"]] - Available payment methods
   * @param {string[]} [config.deliveryMethods=["Home Delivery","In-store Pickup"]] - Available delivery methods
   */
  constructor(config = {}) {
    this.config = deepMerge({
      currency: "DOP",
      locale: "es-DO",
      whatsappNumber: null,
      shipping: { type: "fixed", value: 0, freeFrom: null, perItem: 0 },
      paymentMethods: ["Cash", "Bank Transfer"],
      deliveryMethods: ["Home Delivery", "In-store Pickup"],
      currencies: {},
      regions: {},
      storeName: "Mi Tienda",
    }, config);

    this.state = {
      products: [],
      cart: [],
      coupons: [],
      coupon: null,
      customer: {
        name: null,
        address: null,
        notes: null,
      },
      checkout: {
        paymentMethod: null,
        deliveryMethod: null,
      },
      orders: [],
      downsell: null,
      seasons: [],
      urgency: {},
      bundles: [],
      cro: {
        freeShippingBar: false,
        freeShippingGoal: 0,
        lowStockAlert: false,
        socialProof: false,
        recentlyViewed: false,
        exitIntent: false,
        exitMessage: "",
        exitDiscount: 0,
      },
      recentlyViewed: [],
      activeCurrency: config.currency || "DOP",
      activeRegion: null,
    };

    this.hooks = {
      beforeAddToCart: [],
      afterAddToCart: [],
      afterCartChange: [],
      beforeCheckout: [],
      afterCheckout: [],
      beforeWhatsAppSend: [],
      beforeGenerateWhatsApp: [],
      afterGenerateWhatsApp: [],
      beforeSync: [],
      afterSync: [],
      onCartEmpty: [],
      onRemoveItem: [],
    };

    this.templates = {
      whatsapp: {
        default: { id: "default", fn: this._defaultWhatsAppTemplate() },
      },
      active: "default",
    };

    this._rateLimiters = {};
  }
}

// Apply mixins
initHelpers(Whanda);
initConfig(Whanda);
initCurrency(Whanda);
initRegion(Whanda);
initHooks(Whanda);
initProducts(Whanda);
initCart(Whanda);
initPricing(Whanda);
initCoupons(Whanda);
initShipping(Whanda);
initCustomer(Whanda);
initCheckout(Whanda);
initOrders(Whanda);
initPersistence(Whanda);
initSync(Whanda);
initScalability(Whanda);
initWhatsApp(Whanda);
