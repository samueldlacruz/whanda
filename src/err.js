/**
 * @file Diccionario de códigos de error de Whanda.
 *
 * Todos los mensajes están en español para el mercado objetivo (República
 * Dominicana / Latinoamérica). Los códigos se usan como referencias
 * rápidas en los mensajes de excepción y en la documentación API.
 *
 * Códigos core: W001–W041
 * Códigos plugins: W100–W102 (en whanda-plugins.js)
 *
 * @readonly
 * @enum {string}
 */
export const ERR = {
  /** search() requiere un texto de búsqueda */
  W001: "search() requiere un texto de búsqueda",
  /** Producto no encontrado */
  W002: "Producto no encontrado",
  /** La cantidad debe ser un número entero positivo */
  W003: "La cantidad debe ser un número entero positivo",
  /** Stock insuficiente */
  W004: "Stock insuficiente",
  /** La cantidad debe ser un número entero no negativo */
  W005: "La cantidad debe ser un número entero no negativo",
  /** Producto no encontrado en el carrito */
  W006: "Producto no encontrado en el carrito",
  /** El código del cupón debe ser un texto */
  W007: "El código del cupón debe ser un texto",
  /** Cupón inválido */
  W008: "Cupón inválido",
  /** El cupón ha expirado */
  W009: "El cupón ha expirado",
  /** El cupón alcanzó su límite de usos */
  W010: "El cupón alcanzó su límite de usos",
  /** Monto mínimo de orden no alcanzado */
  W011: "Monto mínimo de orden no alcanzado",
  /** El valor de envío debe ser un número no negativo */
  W012: "El valor de envío debe ser un número no negativo",
  /** El umbral de envío gratis debe ser un número positivo */
  W013: "El umbral de envío gratis debe ser un número positivo",
  /** El envío por ítem debe ser un número no negativo */
  W014: "El envío por ítem debe ser un número no negativo",
  /** Método de envío inválido */
  W015: "Método de envío inválido",
  /** Método de pago inválido */
  W016: "Método de pago inválido",
  /** Método de entrega inválido */
  W017: "Método de entrega inválido",
  /** El carrito está vacío */
  W018: "El carrito está vacío",
  /** El nombre del cliente es requerido */
  W019: "El nombre del cliente es requerido",
  /** La dirección del cliente es requerida */
  W020: "La dirección del cliente es requerida",
  /** El método de pago es requerido */
  W021: "El método de pago es requerido",
  /** El método de entrega es requerido */
  W022: "El método de entrega es requerido",
  /** Estado inválido */
  W023: "Estado inválido",
  /** Orden no encontrada */
  W024: "Orden no encontrada",
  /** Número de WhatsApp no configurado */
  W025: "Número de WhatsApp no configurado",
  /** El número de WhatsApp debe ser texto o número */
  W026: "El número de WhatsApp debe ser texto o número",
  /** El número de WhatsApp debe tener entre 7 y 15 dígitos */
  W027: "El número de WhatsApp debe tener entre 7 y 15 dígitos",
  /** La plantilla debe ser una función */
  W028: "La plantilla debe ser una función",
  /** Plantilla no encontrada */
  W029: "Plantilla no encontrada",
  /** No se puede eliminar la plantilla por defecto */
  W030: "No se puede eliminar la plantilla por defecto",
  /** El ID de la plantilla debe ser un texto no vacío */
  W031: "El ID de la plantilla debe ser un texto no vacío",
  /** Plantilla activa no encontrada */
  W032: "Plantilla activa no encontrada",
  /** El cupón debe tener un 'code' válido */
  W033: "El cupón debe tener un 'code' válido",
  /** El cupón debe tener un 'amount' numérico */
  W034: "El cupón debe tener un 'amount' numérico",
  /** setProducts() requiere un arreglo */
  W035: "setProducts() requiere un arreglo",
  /** debe ser un número positivo */
  W036: "debe ser un número positivo",
  /** Moneda no soportada */
  W037: "Moneda no soportada",
  /** Región no soportada */
  W038: "Región no soportada",
  /** Hook cancelado */
  W039: "Hook cancelado",
  /** JSON inválido en load() */
  W040: "JSON inválido en load()",
  /** load() espera un objeto JSON */
  W041: "load() espera un objeto JSON",
};
