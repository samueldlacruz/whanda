export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const sheetUrl = process.env.GOOGLE_SHEETS_URL;
  if (!sheetUrl) {
    return res.status(500).json({ error: "GOOGLE_SHEETS_URL not configured" });
  }

  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      return res.status(502).json({ error: `Sheets returned ${response.status}` });
    }

    const csv = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
