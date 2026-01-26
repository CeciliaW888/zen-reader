import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client (Server-Side)
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing from server environment.");
}

const ai = new GoogleGenerativeAI(apiKey);

// Proxy Endpoint
app.post('/api/generate', async (req, res) => {
    try {
        const { model, contents, config } = req.body;
        console.log(`[Proxy] Request for model: ${model}`);

        const generativeModel = ai.getGenerativeModel({
            model,
            systemInstruction: config?.systemInstruction,
            tools: config?.tools,
        });

        // The contents should be an array of Content objects. 
        // If it's a string, wrap it in the required structure.
        const formattedContents = typeof contents === 'string'
            ? [{ role: 'user', parts: [{ text: contents }] }]
            : contents;

        const result = await generativeModel.generateContent({
            contents: formattedContents,
            generationConfig: config?.generationConfig || (({ systemInstruction, tools, ...rest }) => rest)(config || {}),
        });
        const responseData = await result.response;
        let text = "";
        try {
            text = responseData.text();
        } catch (e) {
            console.warn("[Proxy] Failed to extract text from response:", e.message);
        }

        console.log(`[Proxy] Success: Received response from ${model}`);
        res.json({
            ...responseData,
            text: text
        });
    } catch (error) {
        console.error("[Proxy] Gemini API Error:", error.message);
        if (error.stack) console.error(error.stack);
        res.status(500).json({
            error: error.message || "Internal Server Error",
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Serve Static Files (Production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

app.use(express.static(distPath));

// Fallback for SPA Routing: Serve index.html for any request that doesn't match an earlier route
app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Serving static files from: ${distPath}`);
});
