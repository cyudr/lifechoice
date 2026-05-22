import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to avoid crash if API key is not yet set
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// REST API route for options generation (e.g. food, generic choices)
app.post('/api/gemini/options', async (req, res) => {
  const { promptType, count } = req.body;
  const numCount = count ? parseInt(count) : 5;

  const client = getAiClient();
  if (!client) {
    // If no client available, return standard options fallback instantly
    return res.json({
      options: [
        'Grab Tacos 🌮',
        'Order Sushi 🍣',
        'Have Burgers 🍔5',
        'Cook Italian 🍝',
        'Green Salad 🥗'
      ]
    });
  }

  try {
    const systemPrompt = `You are a helpful, casual companion specializing in defeating decision paralysis. Provide exactly ${numCount} unique, interesting, and playful options for ${promptType}. Keep them extremely short (max 4-5 words each), include a cute matching emoji in each! Avoid kiddy or overly silly options, keep it casual and high choice value. Always respond in valid JSON format according to the output schema.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Provide ${numCount} options for: ${promptType}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of clean casual options.'
            }
          },
          required: ['options']
        }
      }
    });

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini options error', error);
    res.status(500).json({ error: 'Completions failed', options: ['Order Pizza 🍕', 'Make Salads 🥗'] });
  }
});

// REST API route for text composition replies
app.post('/api/gemini/texts', async (req, res) => {
  const { scenario, tone } = req.body;

  const client = getAiClient();
  if (!client) {
    return res.json({
      texts: [
        "Hey! Wish I could make it but I'm completely wiped out. Enjoy! 😴",
        "Really wish I could go but I have to catch up on sleep tonight. Let's hang soon!",
        "Low battery alert! Tucking myself in with hot herbal tea. Have massive fun! 🔋"
      ]
    });
  }

  try {
    const systemPrompt = `You are a direct, witty reply companion helping overthinkers write quick reply texts. For the given description scenario, generate exactly 3 alternative brief reply texts.
- Suggestion 1 should be a warm, casual reply.
- Suggestion 2 should be a direct, professional, clear reply.
- Suggestion 3 should be a very funny, lighthearted reply.
Keep them short, relatable, with zero awkward structures. Response MUST be in JSON array of strings under "texts" property.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Scenario situation: ${scenario}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            texts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'The three suggested direct texts.'
            }
          },
          required: ['texts']
        }
      }
    });

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini text error', error);
    res.status(500).json({ error: 'Text composition failed' });
  }
});

// Serve frontend based on Node environment
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Decision Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
