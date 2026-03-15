import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';

// Initialize Gemini Client
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is missing from environment.");
}

const ai = new GoogleGenerativeAI(apiKey || '');

// Types
interface GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

interface GenerateRequestBody {
  model: string;
  contents: string | Content[];
  config?: {
    systemInstruction?: string;
    tools?: unknown[];
    generationConfig?: GenerationConfig;
  };
}

// Allowed models whitelist
const ALLOWED_MODELS: string[] = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

// Simple in-memory rate limiting (per deployment instance)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    // New window
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }

  if (record.count >= 30) {
    return false; // Exceeded limit
  }

  record.count++;
  return true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      time: new Date().toISOString(),
      env: {
        hasApiKey: !!apiKey,
        nodeEnv: process.env.NODE_ENV,
        version: '1.1.0'
      }
    });
  }

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed for /api/generate
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
             (req.headers['x-real-ip'] as string) || 
             'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }

  try {
    const body = req.body as GenerateRequestBody;
    const { model, contents, config } = body;

    // Validate model
    if (!model || typeof model !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "model" parameter' });
    }

    if (!ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({
        error: `Invalid model "${model}". Allowed: ${ALLOWED_MODELS.join(', ')}`
      });
    }

    // Validate contents
    if (!contents) {
      return res.status(400).json({ error: 'Missing "contents" parameter' });
    }

    if (typeof contents !== 'string' && !Array.isArray(contents)) {
      return res.status(400).json({ error: '"contents" must be a string or array' });
    }

    // Validate config (optional)
    if (config !== undefined && (typeof config !== 'object' || config === null)) {
      return res.status(400).json({ error: '"config" must be an object' });
    }

    console.log(`[Proxy] Request for model: ${model}`);

    const generativeModel = ai.getGenerativeModel({
      model,
      systemInstruction: config?.systemInstruction,
      tools: config?.tools as Parameters<typeof ai.getGenerativeModel>[0]['tools'],
    });

    // Format contents
    const formattedContents: Content[] = typeof contents === 'string'
      ? [{ role: 'user', parts: [{ text: contents }] }]
      : contents;

    // Generate content
    const result = await generativeModel.generateContent({
      contents: formattedContents,
      ...(config?.generationConfig && { generationConfig: config.generationConfig }),
    });

    const responseData = await result.response;
    let text = "";
    
    try {
      text = responseData.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.warn("[Proxy] Failed to extract text from response:", msg);
    }

    console.log(`[Proxy] Success: Received response from ${model}`);
    
    return res.status(200).json({
      ...responseData,
      text: text
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[Proxy] Gemini API Error:", errorMessage);
    if (errorStack) console.error(errorStack);
    
    return res.status(500).json({
      error: errorMessage || "Internal Server Error",
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });
  }
}
