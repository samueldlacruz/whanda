// ================================
// WHANDA SHEETS ADAPTER
// Google Sheets integration via CSV
// ================================

/**
 * Required CSV column names (lowercase). All must be present in the header row.
 * @type {string[]}
 * @private
 */
const REQUIRED_COLUMNS = ["id", "name", "price", "stock", "category", "image"];

/**
 * Optional CSV column names (lowercase). Parsed from comma-separated strings to arrays.
 * @type {string[]}
 * @private
 */
const OPTIONAL_COLUMNS = ["relatedids", "upsellids", "crosssellids"];

/**
 * Parses a single CSV line into an array of values, respecting quoted fields.
 * Handles escaped quotes (`""`) within quoted values.
 *
 * @param {string} line - A single CSV line
 * @returns {string[]} Array of parsed values
 * @private
 * @example
 * parseCSVLine('"Camisa, Azul",1200,25'); // ["Camisa, Azul", "1200", "25"]
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}

/**
 * Parses a CSV string into an array of product objects.
 * Validates that all required columns are present.
 * Converts `price` to float, `stock` to integer.
 * Parses optional relation columns (relatedids, upsellids, crosssellids) into arrays.
 *
 * @param {string} text - Raw CSV text
 * @returns {Object[]} Array of product objects
 * @throws {Error} If CSV has no data rows or is missing required columns
 * @example
 * const csv = `id,name,price,stock,category,image
 * 1,Camisa,1200,25,Ropa,img.jpg`;
 * const products = parseCSV(csv);
 */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV is empty or has no data rows");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] != null ? values[idx].trim() : "";
    });

    const product = {
      id: obj.id,
      name: obj.name,
      price: parseFloat(obj.price) || 0,
      stock: parseInt(obj.stock, 10) || 0,
      category: obj.category,
      image: obj.image,
    };

    for (const col of OPTIONAL_COLUMNS) {
      if (obj[col] && obj[col] !== "") {
        product[col] = obj[col]
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "");
      }
    }

    products.push(product);
  }

  return products;
}

/**
 * Converts a Google Sheets URL (edit or export) into a CSV export URL.
 * For non-Google URLs, returns the URL unchanged.
 *
 * @param {string} sheetUrl - Google Sheets URL (edit or export format)
 * @returns {string} CSV export URL
 * @example
 * buildGoogleSheetsCsvUrl("https://docs.google.com/spreadsheets/d/ABC123/edit?gid=0");
 * // → "https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=0"
 */
function buildGoogleSheetsCsvUrl(sheetUrl) {
  const url = new URL(sheetUrl);

  if (url.hostname.includes("docs.google.com")) {
    if (!url.pathname.includes("/export")) {
      const match = url.pathname.match(/\/d\/([^/]+)/);
      if (match) {
        const sheetId = match[1];
        const gid = url.searchParams.get("gid") || "0";
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }
    }
    url.searchParams.set("format", "csv");
    return url.toString();
  }

  return sheetUrl.toString();
}

/**
 * Loads products from a Google Sheet into a Whanda instance.
 * Supports two modes:
 * - **Direct**: `sheetUrl` — fetches the CSV directly from Google Sheets (public)
 * - **Proxy**: `proxyUrl` — fetches through a serverless proxy (keeps URL hidden)
 *
 * If both are provided, `proxyUrl` takes priority.
 * Also handles JSON responses with `{ csv: "..." }` or `{ products: [...] }`.
 *
 * @param {Whanda} whanda - Whanda instance to load products into
 * @param {Object} options - Loading options
 * @param {string} [options.proxyUrl] - URL of a serverless proxy that returns the CSV
 * @param {string} [options.sheetUrl] - Direct Google Sheets URL (must be publicly accessible)
 * @returns {Promise<Object[]>} Array of loaded product objects
 * @throws {Error} If neither proxyUrl nor sheetUrl is provided, or fetch fails
 * @throws {Error} If CSV is missing required columns
 * @example
 * // Direct mode
 * await loadFromSheets(whanda, {
 *   sheetUrl: "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=0"
 * });
 *
 * // Proxy mode (recommended for production)
 * await loadFromSheets(whanda, {
 *   proxyUrl: "https://my-app.vercel.app/api/products"
 * });
 */
export async function loadFromSheets(whanda, options = {}) {
  if (!options.proxyUrl && !options.sheetUrl) {
    throw new Error("loadFromSheets() requires either 'proxyUrl' or 'sheetUrl'");
  }

  let fetchUrl;
  if (options.proxyUrl) {
    fetchUrl = options.proxyUrl;
  } else {
    fetchUrl = buildGoogleSheetsCsvUrl(options.sheetUrl);
  }

  const timeout = options.timeout || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(fetchUrl, { signal: controller.signal });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw e;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  let csvText = text;
  if (contentType.includes("application/json")) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${e.message}`);
    }
    if (data.csv) {
      csvText = data.csv;
    } else if (data.products) {
      whanda.setProducts(data.products);
      return data.products;
    }
  }

  const products = parseCSV(csvText);
  whanda.setProducts(products);
  return products;
}

export { parseCSV, buildGoogleSheetsCsvUrl };
