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
  const { scenario, situation, tone, style, emoji, length } = req.body;

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
    const selectedTone = tone || 'casual';
    const selectedStyle = style || 'normal';
    const selectedEmoji = emoji || 'few';
    const selectedLength = length || 'standard';
    const situationText = situation || scenario || '';

    let emojiInstruction = "Use a few tasteful and relevant emojis.";
    if (selectedEmoji === 'none') {
      emojiInstruction = "Do not include any emojis at all under any circumstance.";
    } else if (selectedEmoji === 'expressive') {
      emojiInstruction = "Include several expressive, funny, and engaging emojis.";
    }

    let styleInstruction = "Keep it natural and organic.";
    if (selectedStyle === 'gen_z') {
      styleInstruction = "Use soft Gen-Z slang, lowercase text styling, brainrot-tinted humor, or typical casual slang (e.g. 'no cap', 'fr fr', 'real', 'lowkey').";
    } else if (selectedStyle === 'corporate') {
      styleInstruction = "Write in an elegant, polite, but ultra-tactful corporate speak or corporate overpolite style ('per my previous email', 'recharging bandwidth').";
    } else if (selectedStyle === 'bro') {
      styleInstruction = "Adopt a high-energy, friendly 'bro/surfer' aesthetic ('dude', 'bro', 'surf on this', 'catch ya later').";
    } else if (selectedStyle === 'shakespearean') {
      styleInstruction = "Formulate in highly dramatic Shakespearian style ('Alas!', 'Hark!', 'thy humble servant').";
    }

    let lengthInstruction = "Keep it standard text message length (around 1-2 moderate sentences).";
    if (selectedLength === 'short') {
      lengthInstruction = "Keep it extremely short, crisp, and punchy (1 soft sentence or less than 8 words).";
    } else if (selectedLength === 'detailed') {
      lengthInstruction = "Make it detailed and descriptive (2-3 complete, expressive sentences).";
    }

    const systemPrompt = `You are the master of text message mojo, helping overthinkers write quick, outstanding text replies.
You will receive a communication situation, a desired tone, and specific stylistic guidelines.
Generate exactly 3 different, attractive, and realistic alternative reply texts that fit these instructions.

- Choice 1: The premium suggested text matching the exact combination.
- Choice 2: A slight alternative draft option under the same parameters.
- Choice 3: A quirky/different spin-off matching the criteria.

Strict parameters:
- General Vibe/Topic: ${scenario || 'General Reply'}
- Situation Details: "${situationText}"
- Tone setting: ${selectedTone} (make sure the messages explicitly convey this exact tone)
- Stylistic constraint: ${styleInstruction}
- Emoji requirement: ${emojiInstruction}
- Length limit: ${lengthInstruction}

Return a valid JSON object holding the array of 3 choices in the "texts" property.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate replies for scenario: ${scenario || 'General Response'} with details: "${situationText}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            texts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly three customized variations of reply texts.'
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
    res.status(500).json({ error: 'Text composition failed', texts: [
      "Can't make it tonight unfortunately! 😴",
      "I need to skip this one to rest up. Sorry!",
      "My battery is at 1% fr. Catch you next time! 🔋"
    ] });
  }
});

// REST API route for biometric/aura vibe analysis
app.post('/api/gemini/vibe', async (req, res) => {
  const { customInput } = req.body;

  const client = getAiClient();
  if (!client) {
    // Return a random static choice if Gemini is offline
    const fallbackVibes = [
      {
        title: "You're rocking a relaxed vibe today 🌿",
        subValue: "Very laid-back, modern, and friendly. People find it incredibly easy to open up to you today.",
        metrics: [
          { label: "Casual", percentage: 88, rating: 4 },
          { label: "Trendy", percentage: 72, rating: 4 },
          { label: "Elegant", percentage: 40, rating: 2 },
          { label: "Bohemian", percentage: 80, rating: 4 }
        ],
        bubbles: [
          { label: "Laid-back", percentage: 91 },
          { label: "Sophisticated", percentage: 82 },
          { label: "Cute", percentage: 65 }
        ]
      },
      {
        title: "You're radiating pure corporate high-energy today 💼",
        subValue: "Extremely tidy, focused, and ambitious. You look ready to close five major deals before lunchtime.",
        metrics: [
          { label: "Casual", percentage: 22, rating: 1 },
          { label: "Trendy", percentage: 85, rating: 5 },
          { label: "Elegant", percentage: 95, rating: 5 },
          { label: "Bohemian", percentage: 15, rating: 1 }
        ],
        bubbles: [
          { label: "Ambitious", percentage: 95 },
          { label: "Determined", percentage: 88 },
          { label: "Sophisticated", percentage: 94 }
        ]
      }
    ];
    const randomIndex = Math.floor(Math.random() * fallbackVibes.length);
    return res.json(fallbackVibes[randomIndex]);
  }

  try {
    const inputContext = customInput ? `with keyword: "${customInput}"` : 'with completely random creative sparks';
    const systemPrompt = `You are a professional psychic biometric aura scanner. Your job is to analyze the cosmic vibe profile and energy wavelength of a user ${inputContext}.
Generate a creative, elegant, and playful diagnostic output that reveals their aura signature.

Be playful, clever, and engaging. Return a structured JSON containing:
- "title": a humorous vibe signature name with a nice emoji at the end (e.g., "Radiating Cozy Coffee Dreamer energy ☕", "Sparkling chaotic main character today 🎬").
- "subValue": a highly entertaining, witty review of 2-3 sentences describing this mindset.
- "metrics": a list of exactly 4 specific metric traits. Each has a "label" (e.g. "Chillness", "Sass Level", "Corporate Bandwidth", "Coffee Influence"), "percentage" (0-100), and "rating" (1-5 star score).
- "bubbles": a list of exactly 3 core aura word-tags (e.g. "Caffeinated", "Dreamer", "Main Character", "Relentless") with their associated score "percentage" (10-100).

Make it extremely fun to read! Wrap your output in a valid JSON object matching the defined schema.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Perform vibe scan diagnostics ${inputContext}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subValue: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  percentage: { type: Type.INTEGER },
                  rating: { type: Type.INTEGER }
                },
                required: ['label', 'percentage', 'rating']
              }
            },
            bubbles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  percentage: { type: Type.INTEGER }
                },
                required: ['label', 'percentage']
              }
            }
          },
          required: ['title', 'subValue', 'metrics', 'bubbles']
        }
      }
    });

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText.trim());
    res.json(parsed);
  } catch (error) {
    console.error('Gemini vibe error', error);
    res.status(500).json({
      title: "You're channeling cozy vintage dreamland ☕",
      subValue: "Soft, artistic, thoughtful, and slightly mysterious. You resemble a character from a French indie movie.",
      metrics: [
        { label: "Casual", percentage: 75, rating: 4 },
        { label: "Trendy", percentage: 60, rating: 3 },
        { label: "Elegant", percentage: 78, rating: 4 },
        { label: "Bohemian", percentage: 92, rating: 5 }
      ],
      bubbles: [
        { label: "Artistic", percentage: 92 },
        { label: "Thoughtful", percentage: 87 },
        { label: "Chill", percentage: 90 }
      ]
    });
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
