# ZenReader Roadmap & Status

## Project Goal
To build an immersive, AI-powered "Ghostwriter" application that transforms fragmented content (YouTube videos, raw text, Markdown) into structured, high-quality, book-like reading experiences.

## ✅ What Works (Current Status)

### 1. Core Core Engine ("The Transformer")
- **YouTube to Book:** Fully functional.
    - Uses `gemini-3-pro-preview` with Google Search grounding.
    - Injects a specialized "Podcast-to-Book" skill (Ghostwriter Persona) via system instructions.
    - Automatically generates "Introduction", "Source & Context", and "Bio" sections.
    - Restructures video content into logical, narrative chapters.
- **Text to Book:** Functional.
    - Takes raw text paste and uses AI to organize it into chapters with titles.
- **Markdown Import:** Functional.
    - Local parser splits `.md` files by headers (# H1, ## H2).

### 2. The Reading Experience
- **Distraction-Free Reader:** Implemented using Tailwind Typography (`prose`).
- **Customization:**
    - 5 Themes (Light, Sepia, Dark, Forest, Midnight).
    - Font toggle (Serif/Sans).
    - Font size adjustment.
- **Navigation:**
    - Sidebar TOC (Table of Contents).
    - Next/Previous chapter buttons.
    - Scroll progress preservation.

### 3. AI Companion
- **Side Panel:** Integrated active reading assistant.
- **Chapter Summary:** On-demand summarization of specific chapters.
- **Book Overview:** "Back Cover" style summary of the whole content.
- **Chat:** Context-aware Q&A based on the current chapter text.

### 4. Technical Foundation
- **PWA:** Service Worker is registered; app is installable; assets cached.
- **Persistence:** All books are saved locally using IndexedDB (no data loss on refresh).
- **Responsive:** Mobile-first design with collapsible sidebars.

---

## 🚧 In Progress / Known Limitations

1.  **API Quotas:**
    - The app currently relies on the user's environment variable `API_KEY`.
    - Heavy usage of `gemini-3-pro-preview` for video processing is intensive. We need better error handling for 429 (Too Many Requests) errors.
2.  **Long Video Handling:**
    - Very long videos (>2 hours) might hit context window limits during the "Search & Structure" phase. We currently rely on Gemini's internal search summarization.
3.  **Image Support:**
    - Currently, the "Book" generation is text-only. It does not extract screenshots or slides from YouTube videos.

---

## 🚀 Future Roadmap

### Phase 2: Audio & Accessibility (Next Up)
- [ ] **TTS (Text-to-Speech):** Use Gemini's multi-speaker capabilities to generate an "Audiobook" version of the generated text.
- [ ] **Podcast Mode:** Allow uploading audio files directly (using Gemini 1.5/2.5 native audio multimodal input).

### Phase 3: Cloud & Sync
- [ ] **Backend Sync:** Optional login to sync IndexedDB with Firebase/Supabase.
- [ ] **Cross-Device State:** Sync reading progress across phone and desktop.

### Phase 4: Export & Sharing
- [ ] **EPUB Export:** compile the JSON book structure into a valid EPUB file for Kindle/Apple Books.
- [ ] **PDF Export:** Print-ready PDF generation.
