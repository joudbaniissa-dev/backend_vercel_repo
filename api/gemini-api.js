// api/gemini-proxy.js

export default async function handler(req, res) {
  // --- CORS (adjust if you want to restrict origins later) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  // Read prompt (and optionally model) from the frontend
  const { prompt, model = "models/gemini-2.5-flash-preview-09-2025" } = req.body || {};

  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' in request body." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res
      .status(500)
      .json({ error: "Server is missing GEMINI_API_KEY environment variable." });
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(response.status).json({
        error: "Gemini API error",
        details: errText,
      });
    }

    const data = await response.json();

    // Extract plain text from Gemini response (simplest case)
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("") || "";

    res.status(200).json({ text, raw: data });
  } catch (err) {
    console.error("Server error calling Gemini:", err);
    res.status(500).json({
      error: "Internal server error calling Gemini",
      details: err.message,
    });
  }
}
