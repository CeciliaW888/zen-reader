# Architecture & Technical Decisions

## High-Level Overview

ZenReader is a **Client-Side First** Progressive Web App (PWA). It creates the illusion of a complex backend CMS but runs entirely in the browser, leveraging Google's GenAI API for heavy lifting.

## Core Stack Decisions

### 1. React 19 + Vite
*   **Why:** Performance and modern concurrency features.
*   **Routing:** No complex router needed yet; simple state-based view switching (`activeTab`) keeps the app lightweight and feels like a native mobile app.

### 2. State Management & Persistence: IndexedDB
*   **Decision:** We use native `IndexedDB` (wrapped in promises in `services/db.ts`) instead of LocalStorage.
*   **Reasoning:**
    *   **Capacity:** LocalStorage is capped at ~5MB. Generated books can be large. IndexedDB handles hundreds of megabytes easily.
    *   **Performance:** IndexedDB is asynchronous, preventing UI blocking during load/save operations.
    *   **Privacy:** User data never leaves the device (unless sent to Gemini API for processing).

### 3. UI Styling: Tailwind CSS + Typography
*   **Decision:** Use `@tailwindcss/typography` (`prose` classes).
*   **Reasoning:** Building a "Reader" requires meticulous attention to line-height, kerning, and margins. The `prose` plugin provides distinct, professionally typeset defaults that we customize via `theme` config (Sepia, Midnight, etc.) in `constants.ts`.

### 4. The "Skill Injection" Pattern
*   **Decision:** We embed the prompt engineering logic (the "Podcast-to-Book" skill) directly into the code as a constant (`PODCAST_TO_BOOK_SKILL` in `geminiService.ts`).
*   **Reasoning:**
    *   **Reliability:** In a client-side app, fetching an external `.md` file introduces network latency and potential failure points.
    *   **Versioning:** The skill definition is versioned alongside the code.
    *   **Context:** We pass this skill to the `systemInstruction` parameter of the Gemini API, ensuring the model adopts the "Ghostwriter" persona *before* seeing the user content.

## AI Architecture

### Model Selection
We use a dual-model strategy to balance cost/speed and quality:

1.  **Deep Reasoning (`gemini-3-pro-preview`):**
    *   **Use Case:** The "Import/Generation" phase (YouTube to Book).
    *   **Why:** Creating a book structure from a video requires complex reasoning, search grounding (to find the transcript/info), and strict schema adherence.
2.  **Speed/Chat (`gemini-3-flash-preview`):**
    *   **Use Case:** Chat, Summarization, Text Organization.
    *   **Why:** Low latency is critical for the chat interface. Flash is sufficiently smart for Q&A on existing context.

### The "Ghostwriter" Pipeline
When a user inputs a YouTube URL:
1.  **Search:** The model uses the `googleSearch` tool to find metadata and content about the video.
2.  **Instruction:** The model applies the `PODCAST_TO_BOOK_SKILL` (narrative non-fiction rules).
3.  **Schema Enforcement:** We force a `responseSchema` (JSON) to ensure we get a valid Title and Array of Chapters, rather than unstructured text.
