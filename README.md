# ZenReader

![ZenReader Hero](docs/hero.png)

An AI-powered progressive web app (PWA) that transforms content (YouTube videos, text, files) into high-quality, distraction-free ebook chapters using Google Gemini AI. Features include smart formatting, AI summaries, Q&A chat, and EPUB export.

## Features

- **Paged Reading** — Kindle-style page flipping with arrow buttons, keyboard, swipe, and tap zones
- **Smart Format** — AI-powered content restructuring into well-organized chapters
- **AI Summaries** — Chapter and book-level summaries via Gemini
- **Q&A Chat** — Ask questions about the content
- **EPUB Export** — Download books as `.epub` files
- **Multiple Import Sources** — Files (PDF, DOCX, MD, TXT, SRT/VTT), YouTube URLs, or raw text
- **Themes** — Light, sepia, dark, forest, midnight
- **Offline-First** — All books stored locally in IndexedDB

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. Start both servers:
   ```bash
   # Terminal 1: Backend API server (port 8080)
   npm run dev:server

   # Terminal 2: Frontend dev server (port 3000)
   npm run dev
   ```

4. Open http://localhost:3000

## Development Scripts

- `npm run dev` — Start the frontend dev server
- `npm run dev:server` — Start the backend API server
- `npm run build` — Build for production
- `npm run preview` — Preview the production build
- `npm run lint` — Run ESLint
- `npm run test` — Run tests with Vitest

## Tech Stack

- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State**: Zustand
- **AI**: Google Gemini API (via Express proxy)
- **Testing**: Vitest + React Testing Library
- **Storage**: IndexedDB (books), localStorage (settings)

## Deployment

Docker single-container deployment to Google Cloud Run:

```bash
docker build -t zenreader .
gcloud run deploy zenreader \
  --source . \
  --port 8080 \
  --set-env-vars VITE_GEMINI_API_KEY=your_key \
  --allow-unauthenticated
```

## Security

- API key is stored server-side only (Express proxy) — never exposed to the browser
- Rate limiting: 30 requests/min per IP
- Model whitelist: only approved Gemini models accepted
- See `docs/SECURITY.md` for details
