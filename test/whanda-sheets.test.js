import { describe, it, expect, vi, beforeEach } from "vitest";
import { Whanda } from "../src/whanda.js";
import { loadFromSheets, parseCSV, buildGoogleSheetsCsvUrl } from "../src/whanda-sheets.js";

const validCSV = `id,name,price,stock,category,image
1,Camisa Azul,1200,25,Ropa,img1.jpg
2,Pantalón Negro,2500,15,Ropa,img2.jpg
3,Zapatos Café,3500,10,Calzado,img3.jpg`;

const csvWithRelations = `id,name,price,stock,category,image,relatedIds,upsellIds,crossSellIds
1,Camisa,1200,25,Ropa,img.jpg,2,3,4`;

const csvWithCommas = `id,name,price,stock,category,image
1,"Camisa, Azul",1200,25,Ropa,img.jpg`;

const csvEmpty = `id,name,price,stock,category,image`;

const csvMissingColumns = `id,name,price
1,Test,100`;

// =========================================================
// parseCSV
// =========================================================

describe("parseCSV", () => {
  it("should parse valid CSV", () => {
    const products = parseCSV(validCSV);
    expect(products).toHaveLength(3);
    expect(products[0].name).toBe("Camisa Azul");
    expect(products[0].price).toBe(1200);
    expect(products[0].stock).toBe(25);
  });

  it("should convert price to number", () => {
    const products = parseCSV(validCSV);
    expect(typeof products[0].price).toBe("number");
  });

  it("should convert stock to integer", () => {
    const products = parseCSV(validCSV);
    expect(Number.isInteger(products[0].stock)).toBe(true);
  });

  it("should parse comma-separated relation fields into arrays", () => {
    const products = parseCSV(csvWithRelations);
    expect(products[0].relatedids).toEqual(["2"]);
    expect(products[0].upsellids).toEqual(["3"]);
    expect(products[0].crosssellids).toEqual(["4"]);
  });

  it("should handle quoted fields with commas", () => {
    const products = parseCSV(csvWithCommas);
    expect(products[0].name).toBe("Camisa, Azul");
  });

  it("should throw for missing required columns", () => {
    expect(() => parseCSV(csvMissingColumns)).toThrow("Missing required columns");
  });

  it("should throw for empty CSV", () => {
    expect(() => parseCSV("")).toThrow("CSV is empty");
  });

  it("should skip empty rows", () => {
    const csv = `id,name,price,stock,category,image
1,Camisa,1200,25,Ropa,img.jpg

2,Pantalón,2500,15,Ropa,img2.jpg`;
    const products = parseCSV(csv);
    expect(products).toHaveLength(2);
  });
});

// =========================================================
// buildGoogleSheetsCsvUrl
// =========================================================

describe("buildGoogleSheetsCsvUrl", () => {
  it("should convert edit URL to export CSV URL", () => {
    const url = buildGoogleSheetsCsvUrl(
      "https://docs.google.com/spreadsheets/d/ABC123/edit?gid=0"
    );
    expect(url).toContain("/export?format=csv&gid=0");
    expect(url).toContain("ABC123");
  });

  it("should handle URL with custom gid", () => {
    const url = buildGoogleSheetsCsvUrl(
      "https://docs.google.com/spreadsheets/d/ABC123/edit?gid=456"
    );
    expect(url).toContain("gid=456");
  });

  it("should add format=csv to existing export URL", () => {
    const url = buildGoogleSheetsCsvUrl(
      "https://docs.google.com/spreadsheets/d/ABC123/export"
    );
    expect(url).toContain("format=csv");
  });

  it("should pass through non-Google URLs unchanged", () => {
    const url = buildGoogleSheetsCsvUrl("https://example.com/data.csv");
    expect(url).toBe("https://example.com/data.csv");
  });
});

// =========================================================
// loadFromSheets
// =========================================================

describe("loadFromSheets", () => {
  let whanda;

  beforeEach(() => {
    whanda = new Whanda();
  });

  it("should throw if neither proxyUrl nor sheetUrl provided", async () => {
    await expect(loadFromSheets(whanda, {})).rejects.toThrow("requires either");
  });

  it("should load products from proxyUrl", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "text/plain" },
      text: () => Promise.resolve(validCSV),
    });

    const products = await loadFromSheets(whanda, { proxyUrl: "https://proxy.example.com/api/products" });
    expect(products).toHaveLength(3);
    expect(whanda.getProducts()).toHaveLength(3);
    expect(products[0].name).toBe("Camisa Azul");
  });

  it("should load products from sheetUrl", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "text/plain" },
      text: () => Promise.resolve(validCSV),
    });

    const products = await loadFromSheets(whanda, {
      sheetUrl: "https://docs.google.com/spreadsheets/d/ABC123/edit?gid=0",
    });
    expect(products).toHaveLength(3);
  });

  it("should prefer proxyUrl over sheetUrl", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "text/plain" },
      text: () => Promise.resolve(validCSV),
    });

    await loadFromSheets(whanda, {
      proxyUrl: "https://proxy.example.com",
      sheetUrl: "https://docs.google.com/spreadsheets/d/ABC123/edit",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://proxy.example.com",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("should throw on fetch failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(
      loadFromSheets(whanda, { proxyUrl: "https://proxy.example.com" })
    ).rejects.toThrow("Failed to fetch products");
  });

  it("should handle JSON response with csv field", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      text: () => Promise.resolve(JSON.stringify({ csv: validCSV })),
    });

    const products = await loadFromSheets(whanda, { proxyUrl: "https://proxy.example.com" });
    expect(products).toHaveLength(3);
  });

  it("should handle JSON response with products array", async () => {
    const jsonData = {
      products: [
        { id: "1", name: "Test", price: 100, stock: 5, category: "X", image: "x.jpg" },
      ],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      text: () => Promise.resolve(JSON.stringify(jsonData)),
    });

    const products = await loadFromSheets(whanda, { proxyUrl: "https://proxy.example.com" });
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Test");
  });

  it("should throw for CSV with missing columns", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "text/plain" },
      text: () => Promise.resolve("id,name\n1,Test"),
    });

    await expect(
      loadFromSheets(whanda, { proxyUrl: "https://proxy.example.com" })
    ).rejects.toThrow("Missing required columns");
  });
});
