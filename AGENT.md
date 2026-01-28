# Agent Knowledge Base & Troubleshooting Log

## Project Overview

ZenReader is an AI-powered ebook reader built with:
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express + TypeScript (API proxy for Gemini)
- **State:** Zustand (in-memory) + IndexedDB (persistence)
- **AI:** Google Gemini 2.5 series (Pro, Flash, Flash-Lite)

## Project Structure (January 2026)

```
src/
├── components/
│   ├── ai/              # AIPanel
│   ├── common/          # ErrorBoundary, Skeleton
│   ├── library/         # LibraryUpload, SplashScreen
│   └── reader/          # ReaderTopBar, AppearanceMenu
├── constants/           # Theme definitions, settings defaults
├── services/            # db.ts, geminiService.ts
├── store/               # Zustand stores (book, settings, UI)
├── types/               # TypeScript interfaces
└── utils/               # fileHelpers, errorMessages, etc.

server/
└── index.ts             # TypeScript Express backend
```

## Quick Commands

### Development
```bash
npm run dev          # Start Vite dev server (port 3000)
npm run dev:server   # Start backend with hot reload
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run Vitest tests
```

### Production
```bash
npm start            # Run TypeScript server with tsx
```

### Health Check
```powershell
# Local
Invoke-RestMethod -Uri http://localhost:8080/health

# Production
Invoke-RestMethod -Uri https://zenreader-757733164050.us-west1.run.app/health
```

### Test API Proxy
```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/generate -Method Post -ContentType "application/json" -Body '{"model": "gemini-2.5-flash", "contents": "Hi", "config": {}}'
```

---

## Deployment: Missing API Key in Cloud Run

### Symptom
The deployed application failed to initialize the Gemini Service, throwing `Error: API Key missing.`

### Root Cause
1.  **Build-Time vs Run-Time**: Vite requires `VITE_*` environment variables at build time.
2.  **Cloud Build Limitation**: `--set-build-env-vars` doesn't automatically map to Docker `ARG`s.

### Solution
**Direct Source Injection**:
1.  Create `.env.production` with `VITE_GEMINI_API_KEY=...` locally
2.  Run `gcloud run deploy --source .`
3.  Delete `.env.production` immediately after
4.  The build script picks up `.env.production` automatically

---

## Deployment: Persistent Old UI (Caching)

### Symptom
After redeploying, the browser shows old UI version.

### Root Cause
**Service Worker Caching**: `CacheStorage` holds stale content.

### Solution
1.  **Cache Version Bump**: Update `CACHE_NAME` in `sw.js`
2.  **Aggressive Unregistration**: Add code to unregister old service workers
3.  **Forced Activation**: Delete old caches in `activate` event

---

## AI Functionality Debugging

### Model Configuration (January 2026)
Current model chains with fallbacks:

```typescript
PRO_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'];
FLASH_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
YOUTUBE_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
```

### Allowed Models (Server Whitelist)
```typescript
ALLOWED_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];
```

### Rate Limiting
- 30 requests per minute per IP
- Uses `express-rate-limit` middleware

---

## "Smart Format" Language Translation Issue

### Symptom
The "Smart Format" feature was translating content unexpectedly.

### Root Cause
Gemini prompt wasn't strict enough about language preservation.

### Solution
Split language handling into two functions:
- `getLanguageInstructionForGeneration()` - Respects target language setting
- `getLanguageInstructionForInteraction()` - Auto-detects and preserves source language

---

## Error Handling

### User-Friendly Error Messages
Centralized in `src/utils/errorMessages.ts`:
- Rate limiting → "You're sending requests too quickly..."
- API key errors → "There's an issue with the AI service..."
- Network errors → "Unable to connect to the server..."
- YouTube errors → "Unable to fetch the video transcript..."

### Error Boundaries
React Error Boundaries wrap major components:
- `<ErrorBoundary>` around `<Reader>`
- `<ErrorBoundary>` around `<AIPanel>`

---

## State Management (Zustand)

### Stores
1. **useBookStore** - Book and chapter state
   - `book`, `currentChapterId`
   - `setBook()`, `updateBook()`, `clearBook()`

2. **useSettingsStore** - Reader settings (persisted)
   - `theme`, `fontSize`, `fontFamily`
   - Auto-persisted to localStorage

3. **useUIStore** - UI state
   - `showSplash`, `sidebarOpen`, `aiPanelOpen`
   - `initialLibraryTab`

---

## Content Limits

```typescript
CONTENT_LIMITS = {
  CHAPTER_SUMMARY: 10000,    // ~2,500 tokens
  BOOK_SUMMARY_CHUNK: 20000, // ~5,000 tokens per chunk
  QUESTION_CONTEXT: 15000,   // ~3,750 tokens
  MAX_BOOK_CONTENT: 100000,  // Above this, use chunking
};
```
