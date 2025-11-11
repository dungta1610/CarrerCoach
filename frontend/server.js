import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

app.post("/api/gemini", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey)
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY" });

    const {
      prompt,
      model = "gemini-2.5-flash",
      maxOutputTokens,
    } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...(Number.isFinite(maxOutputTokens)
        ? { generationConfig: { maxOutputTokens } }
        : {}),
    };

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    return res.json({ ok: true, text, raw: data });
  } catch (e) {
    console.error("Gemini API error:", e);
    res.status(500).json({ error: String(e) });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
