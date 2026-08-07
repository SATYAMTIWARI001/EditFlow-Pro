import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Set up body parsers with generous limits for base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. AI template analysis will use fallback coordinates.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Template Analyzer endpoint
app.post("/api/analyze-template", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing image base64 data" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return default center placement fallback cleanly
      return res.json({
        x: 50,
        y: 50,
        fontSize: 5,
        alignment: "center",
        reason: "Default center placement.",
        isFallback: true
      });
    }

    // Prepare image for Gemini
    // Clean base64 string if it contains data URI prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mime = mimeType || "image/png";

    const prompt = `Analyze this certificate template image and identify the exact position where the participant's name should be placed.
Identify features like:
- Blank lines, underlines, or empty spaces meant for a name (e.g., 'This is to certify that _____', 'Awarded to', or just empty space between titles).
- Any existing placeholders or labels like 'Name', 'Participant Name'.

Provide the layout analysis as a raw JSON object containing these exact fields:
{
  "x": number (percentage from left edge, 0 to 100, where the name's horizontal center should be),
  "y": number (percentage from top edge, 0 to 100, where the name's vertical center should be),
  "fontSize": number (suggested font size in percentage relative to image height, e.g., 4 to 8 is typical),
  "alignment": "center" | "left" | "right",
  "reason": "a brief explanation of why this spot was selected"
}

Do not wrap the response in markdown code blocks like \`\`\`json. Return ONLY the raw JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mime
          }
        }
      ]
    });

    const text = response.text?.trim() || "";
    // Attempt to parse JSON (and strip any markdown if the model ignored instructions)
    let cleanedText = text;
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "");
    }
    cleanedText = cleanedText.trim();

    try {
      const result = JSON.parse(cleanedText);
      res.json({
        x: Math.max(0, Math.min(100, Number(result.x || 50))),
        y: Math.max(0, Math.min(100, Number(result.y || 50))),
        fontSize: Math.max(1, Math.min(20, Number(result.fontSize || 5))),
        alignment: result.alignment || "center",
        reason: result.reason || "Detected placement via Gemini AI.",
        isFallback: false
      });
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text, parseError);
      res.json({
        x: 50,
        y: 50,
        fontSize: 5,
        alignment: "center",
        reason: "Failed to parse AI suggestions, using default center.",
        isFallback: true
      });
    }
  } catch (error: any) {
    console.error("Error in AI analysis:", error);
    res.status(500).json({
      error: error.message || "Failed to analyze template with AI.",
      isFallback: true
    });
  }
});

// Certificate ID Generator Endpoint (for unique IDs)
app.post("/api/generate-id", (req, res) => {
  const { prefix = "CERT" } = req.body;
  const year = new Date().getFullYear();
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  const certId = `${prefix}-${year}-${randomStr}`;
  res.json({ certId });
});

// EditFlow AI Co-Pilot / Command Assistant endpoint
app.post("/api/ai-command", async (req, res) => {
  try {
    const { command, template } = req.body;
    if (!command || !template) {
      return res.status(400).json({ error: "Missing command or template in request body" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: "Gemini API Key is not configured on this workspace." });
    }

    const prompt = `You are EditFlow AI Co-Pilot, an advanced graphic design AI agent.
Your task is to parse a natural language command from the user and modify a certificate/document template's layout and style configuration.

Here is the current Template configuration:
${JSON.stringify({
  fields: template.fields,
  qrCode: template.qrCode,
  signature: template.signature,
  watermark: template.watermark
}, null, 2)}

The user command is: "${command}"

Instructions for modifying the layout:
1. Identify which elements are mentioned in the command (e.g. "name", "date", "signature", "qr code", "watermark", "title"). Map "name" to field with name "NAME", "date" to "DATE", etc.
2. For identified fields, modify their positioning (x, y, width) or text styling (fontFamily, fontSize, fontWeight, fontColor (MUST be hex like #ff0000), letterSpacing, rotation, opacity, isBold, isItalic, isUnderline, textTransform).
3. Coordinate grid info: x and y coordinates are percentages (0 to 100) on the certificate canvas. "Move name down" means increase y. "Move name left" means decrease x.
4. If asked to ADD custom text, stamps, logos, stickers, or shapes:
   - Create a new field in the "fields" array.
   - Set a unique id: "field-ai-" + Date.now().
   - Set name to a descriptive uppercase name:
     - For standard text: e.g. "CUSTOM_TEXT", "TITLE"
     - For shapes: "SHAPE_CIRCLE", "SHAPE_RECTANGLE", "SHAPE_ARROW"
     - For stickers/emojis: "EMOJI_STAR", "EMOJI_MEDAL", "EMOJI_CROWN"
     - For logo uploads: "LOGO_IMAGE" (use placeholder for default url, e.g. "https://img.icons8.com/color/120/google-logo.png" or similar)
   - Position it sensibly on the canvas near the center (e.g. x: 50, y: 55) or as requested.
5. If asked to REMOVE/DELETE a field, you can filter it out of the fields list.
6. If modifying "qrCode", "signature", or "watermark", modify their respective JSON objects. Toggle "enabled" to true/false if requested.

Provide the exact resulting modified layout as a raw JSON object containing only these four root keys. Do not include other fields from the template:
{
  "fields": [...],
  "qrCode": {...},
  "signature": {...},
  "watermark": {...}
}

Respond ONLY with this raw JSON. Do not write any markdown code block wrappers like \`\`\`json. Return pure JSON text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt]
    });

    const text = response.text?.trim() || "";
    let cleanedText = text;
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "");
    }
    cleanedText = cleanedText.trim();

    try {
      const result = JSON.parse(cleanedText);
      res.json({
        success: true,
        data: {
          fields: result.fields || template.fields,
          qrCode: result.qrCode || template.qrCode,
          signature: result.signature || template.signature,
          watermark: result.watermark || template.watermark
        }
      });
    } catch (parseError) {
      console.error("AI command JSON parse error:", text, parseError);
      res.status(500).json({ error: "Failed to parse AI command modifications.", rawText: text });
    }
  } catch (err: any) {
    console.error("AI command error:", err);
    res.status(500).json({ error: err.message || "Unknown error during AI editing" });
  }
});

// AI Document Summary Endpoint
app.post("/api/doc-summary", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text provided to summarize" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: "Gemini API Key is not configured on this workspace." });
    }

    const prompt = `You are a professional document analyst. Provide a high-level executive summary, a concise outline of the document, and 4-5 key bullet point takeaways for this text:\n\n${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt]
    });

    res.json({ summary: response.text?.trim() || "No summary was generated." });
  } catch (err: any) {
    console.error("Summary error:", err);
    res.status(500).json({ error: err.message || "Unknown error during document summary" });
  }
});

// AI Document Chat Endpoint
app.post("/api/doc-chat", async (req, res) => {
  try {
    const { text, question, history } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Missing user question" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: "Gemini API Key is not configured on this workspace." });
    }

    const prompt = `You are a helpful AI Document Assistant. You have access to the following document content:
=== BEGIN DOCUMENT ===
${text || "No document loaded."}
=== END DOCUMENT ===

Here is the previous chat context:
${history || ""}

Answer the following user question using ONLY the provided document details if possible. If the answer is not inside the document, politely say so but offer a helpful analytical estimation.
User Question: ${question}
Response:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt]
    });

    res.json({ response: response.text?.trim() || "I couldn't generate a response." });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Unknown error during document chat" });
  }
});

// Vite / static file middleware
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support SPA router fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start Vite:", err);
});
