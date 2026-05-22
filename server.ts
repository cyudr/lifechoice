import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': "aistudio-build",
      },
    },
  });
}

// API Route for Gemini suggestions on category choices
app.post("/api/suggest-options", async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      res.status(400).json({ error: "Category is required." });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: "Gemini API key is not configured. Go to Settings > Secrets in AI Studio to set GEMINI_API_KEY."
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a helpful and creative decision-making assistant. Generate a catchy, creative title and an array of 4 to 8 unique, realistic, and highly distinct choices for a user trying to decide about: "${category}". Keep options distinct and short (under 24 characters).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "options"],
          properties: {
            title: {
              type: Type.STRING,
              description: "A fun and catchy title for this decision category.",
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4 to 8 distinct choices/options for the decision.",
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI.");
    }

    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("AI Generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate recommendations with AI." });
  }
});

// API Route for Gemini Smart 8-Ball Oracle Answers
app.post("/api/magic8-ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      res.status(400).json({ error: "Question is required." });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: "Gemini API key is not configured."
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the mystical, witty, and clever Magic 8-Ball Oracle. Provide a short, captivating yes/no style answer (exactly 1 sentence, under 10 words) responding to this question: "${question}". Be creative, slightly sassy, philosophical, or deeply cosmic, and format the output inside the requested JSON 'answer' schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["answer"],
          properties: {
            answer: {
              type: Type.STRING,
              description: "A short, witty, yes/no oriented oracle response under 10 words.",
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI Oracle.");
    }

    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Oracle AI failed:", error);
    res.status(500).json({ error: error.message || "Celestial paths are blocked." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
