import { ERR } from "./err.js";

/**
 * Inicializa los métodos de WhatsApp en el prototipo de Whanda.
 *
 * Maneja templates, generación de mensajes, enlaces wa.me,
 * compartir catálogo y página de agradecimiento.
 *
 * @param {typeof import("./whanda.js").Whanda} Whanda
 */
export function initWhatsApp(Whanda) {
  /**
   * Establece el número de WhatsApp (solo dígitos, 7–15 caracteres).
   *
   * @param {string|number} number - Número de WhatsApp
   * @throws {Error} W026 si no es string o número
   * @throws {Error} W027 si no tiene entre 7 y 15 dígitos
   */
  Whanda.prototype.setWhatsAppNumber = function (number) {
    if (typeof number !== "string" && typeof number !== "number") {
      throw new Error(ERR.W026);
    }
    const str = String(number).replace(/[^0-9]/g, "");
    if (str.length < 7 || str.length > 15) {
      throw new Error(ERR.W027);
    }
    this.config.whatsappNumber = str;
  };

  /**
   * Registra una plantilla personalizada de WhatsApp.
   *
   * @param {string} id - Identificador único de la plantilla
   * @param {Function} fn - Función que recibe una orden y retorna el mensaje
   * @throws {Error} W031 si id no es string no vacío
   * @throws {Error} W028 si fn no es función
   */
  Whanda.prototype.registerWhatsAppTemplate = function (id, fn) {
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error(ERR.W031);
    }
    if (typeof fn !== "function") {
      throw new Error(ERR.W028);
    }
    this.templates.whatsapp[id] = { id, fn };
  };

  /**
   * Activa una plantilla de WhatsApp por su ID.
   *
   * @param {string} id - ID de la plantilla registrada
   * @throws {Error} W029 si la plantilla no existe
   */
  Whanda.prototype.setWhatsAppTemplate = function (id) {
    if (!this.templates.whatsapp[id]) {
      throw new Error(`${ERR.W029}: "${id}"`);
    }
    this.templates.active = id;
  };

  /**
   * Retorna los IDs de todas las plantillas registradas.
   * @returns {string[]}
   */
  Whanda.prototype.listWhatsAppTemplates = function () {
    return Object.keys(this.templates.whatsapp);
  };

  /**
   * Retorna una plantilla por su ID o null.
   *
   * @param {string} id
   * @returns {{ id: string, fn: Function }|null}
   */
  Whanda.prototype.getWhatsAppTemplate = function (id) {
    return this.templates.whatsapp[id] || null;
  };

  /**
   * Elimina una plantilla. No se puede eliminar "default".
   *
   * @param {string} id - ID de la plantilla
   * @throws {Error} W030 si se intenta eliminar "default"
   * @throws {Error} W029 si la plantilla no existe
   */
  Whanda.prototype.removeWhatsAppTemplate = function (id) {
    if (id === "default") {
      throw new Error(ERR.W030);
    }
    if (!this.templates.whatsapp[id]) {
      throw new Error(`${ERR.W029}: "${id}"`);
    }
    if (this.templates.active === id) {
      this.templates.active = "default";
    }
    delete this.templates.whatsapp[id];
  };

  /**
   * Retorna el resultado de una plantilla sin enviar el mensaje.
   *
   * @param {string} id - ID de la plantilla
   * @param {Object} order - Objeto orden
   * @returns {string} Mensaje generado
   * @throws {Error} W029 si la plantilla no existe
   */
  Whanda.prototype.previewWhatsAppTemplate = function (id, order) {
    const template = this.templates.whatsapp[id];
    if (!template) throw new Error(ERR.W029);
    return template.fn(order);
  };

  /**
   * Genera el mensaje de WhatsApp usando la plantilla activa.
   * Ejecuta hooks: beforeGenerateWhatsApp, afterGenerateWhatsApp.
   *
   * @param {Object} order - Objeto orden
   * @returns {Promise<string>} Mensaje final
   * @throws {Error} W032 si no hay plantilla activa
   */
  Whanda.prototype.generateMessage = async function (order) {
    const templateObj = this.templates.whatsapp[this.templates.active];
    if (!templateObj) throw new Error(ERR.W032);
    let message = templateObj.fn(order);
    message = await this.runHooks("beforeGenerateWhatsApp", message);
    message = await this.runHooks("afterGenerateWhatsApp", message);
    return message;
  };

  /**
   * Genera un enlace wa.me con el mensaje codificado.
   *
   * @param {Object} order - Objeto orden
   * @returns {Promise<string>} URL de WhatsApp
   * @throws {Error} W025 si no hay número configurado
   */
  Whanda.prototype.generateLink = async function (order) {
    if (!this.config.whatsappNumber) {
      throw new Error(ERR.W025);
    }
    const message = encodeURIComponent(await this.generateMessage(order));
    return `https://wa.me/${this.config.whatsappNumber}?text=${message}`;
  };

  /**
   * Genera el enlace de WhatsApp y dispara hooks.
   *
   * @param {Object} order - Objeto orden
   * @returns {Promise<string>} URL de WhatsApp
   */
  Whanda.prototype.sendToWhatsApp = async function (order) {
    await this.runHooks("beforeWhatsAppSend", order);
    return await this.generateLink(order);
  };

  /**
   * Genera un enlace para compartir el catálogo por WhatsApp.
   *
   * @param {Object} [options={}]
   * @param {string} [options.message] - Mensaje personalizado
   * @param {string} [options.url] - URL del catálogo
   * @returns {string} URL de WhatsApp API
   */
  Whanda.prototype.getShareCatalogUrl = function (options = {}) {
    const storeName = this.config.storeName || "Mi Tienda";
    const productCount = this.state.products.length;
    const categories = this.getCategories();
    const categoriesText = categories.length > 0 ? `\n📦 Categorías: ${categories.join(", ")}` : "";
    const message = options.message ||
      `🛍️ *${storeName}*\n\nTenemos ${productCount} productos disponibles${categoriesText}\n\n${options.url ? `Ver catálogo: ${options.url}` : ""}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message.trim())}`;
  };

  /**
   * Genera HTML de página de agradecimiento post-compra.
   * Todos los valores se sanitizan contra XSS.
   *
   * @param {Object} [options={}]
   * @param {string} [options.message="¡Gracias por tu compra!"] - Mensaje principal
   * @param {boolean} [options.showOrderSummary=true] - Mostrar resumen de la última orden
   * @param {string} [options.shareText="Compra en nuestra tienda"] - Texto para compartir
   * @param {string} [options.catalogUrl="#"] - URL del catálogo
   * @returns {string} HTML sanitizado
   */
  Whanda.prototype.getThankYouHtml = function (options = {}) {
    const {
      message = "¡Gracias por tu compra!",
      showOrderSummary = true,
      shareText = "Compra en nuestra tienda",
      catalogUrl = "#",
    } = options;
    const lastOrder = this.getLastOrder();
    const storeName = this.config.storeName || "Mi Tienda";
    let orderSummary = "";
    if (showOrderSummary && lastOrder) {
      const items = lastOrder.items
        .map((i) => `<li>${this._sanitizeString(i.name)} x${i.quantity} - ${this.formatPrice(i.price * i.quantity)}</li>`)
        .join("");
      orderSummary = `
        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0;">Resumen de tu orden</h3>
          <ul style="margin: 0; padding-left: 20px;">${items}</ul>
          <p style="margin: 10px 0 0 0; font-weight: bold;">
            Total: ${this.formatPrice(lastOrder.total)}
          </p>
        </div>
      `;
    }
    const safeCatalogUrl = this._sanitizeString(catalogUrl);
    return `
      <div style="text-align: center; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h2 style="color: #28a745;">✓ ${this._sanitizeString(message)}</h2>
        <p style="color: #666;">${this._sanitizeString(storeName)}</p>
        ${orderSummary}
        <div style="margin-top: 30px;">
          <a href="${safeCatalogUrl}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 5px;">
            Volver al catálogo
          </a>
          <a href="${this.getShareCatalogUrl({ message: shareText })}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #25d366; color: white; text-decoration: none; border-radius: 6px; margin: 5px;">
            Compartir con un amigo
          </a>
        </div>
      </div>
    `.trim();
  };

  /**
   * Plantilla por defecto de WhatsApp. Muestra resumen de la orden
   * con ítems, precios, impuestos, moneda y datos del cliente.
   *
   * @returns {Function} Función template(order) => string
   */
  Whanda.prototype._defaultWhatsAppTemplate = function () {
    return (order) => {
      const items = order.items
        .map((i) => `- ${i.name} x${i.quantity}`)
        .join("\n");
      const customerInfo = order.customer.name
        ? `\n👤 *Cliente:* ${order.customer.name}\n📍 *Dirección:* ${order.customer.address}`
        : "";
      const taxInfo = order.tax > 0
        ? `\n${order.taxName || "Tax"} (${(order.taxRate * 100).toFixed(0)}%): ${order.tax}`
        : "";
      const currencyInfo = order.currency && order.currency !== "DOP"
        ? `\n💱 Moneda: ${order.currency}`
        : "";
      return `
🛒 *Nuevo Pedido*
${customerInfo}

${items}

Subtotal: ${order.subtotal}
Envío: ${order.shipping}
Descuento: ${order.discount}${taxInfo}${currencyInfo}
Total: *${order.total}*

Pago: ${order.paymentMethod || "N/A"}
Entrega: ${order.deliveryMethod || "N/A"}
      `.trim();
    };
  };
}
