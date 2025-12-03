// api/gemini-api.js

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://joudbaniissa-dev.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel usually gives a parsed object, but be defensive in case it's a string
    const rawBody = req.body || {};
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody || '{}') : rawBody;

    let payload;

    // Mode 1: simple `{ prompt: "..." }`
    if (typeof body.prompt === 'string') {
      payload = {
        contents: [{ role: 'user', parts: [{ text: body.prompt }] }],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      };

    // Mode 2: full Gemini-style payload from your frontend (`contents`, `systemInstruction`, etc.)
    } else if (body && body.contents) {
      payload = body;

    } else {
      return res
        .status(400)
        .json({ error: 'Missing "prompt" or Gemini "contents" in request body' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }

    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=' +
      apiKey;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await resp.text(); // read once
    if (!resp.ok) {
      console.error('Gemini API error:', resp.status, text);
      return res.status(resp.status).json({
        error: 'Gemini API error',
        status: resp.status,
        details: text,
      });
    }

    const data = text ? JSON.parse(text) : {};
    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error in gemini-api:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
