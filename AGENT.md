# Agent Knowledge Base & Troubleshooting Log

## Deployment: Missing API Key in Cloud Run

### Symptom
The deployed application failed to initialize the Gemini Service, throwing `Error: API Key missing.` despite `VITE_GEMINI_API_KEY` being set in Cloud Run environment variables and deployment flags.

### Root Cause
1.  **Build-Time vs Run-Time**: Vite requires `VITE_*` environment variables to be present **at build time** (`npm run build`) to inline them into the static bundle.
2.  **Cloud Build Limitation**: When running `gcloud run deploy --source .`, the `--set-build-env-vars` flag is supposed to pass variables to the build environment. However, when using a custom `Dockerfile`, these do not automatically map to Docker `ARG`s unless explicitly defined and passed.
3.  **Docker Scope**: The Dockerfile defined `ARG VITE_GEMINI_API_KEY`, but the build context from `gcloud` wasn't populating it reliably, leading to an empty value during the build.

### Solution
**Direct Source Injection**:
Instead of relying on CI/CD variable passing magic, we created a temporary `.env.production` file locally containing the key *before* running the deploy command.
1.  Create `.env.production` with `VITE_GEMINI_API_KEY=...`
2.  Run `gcloud run deploy --source .` (The file is uploaded with the source).
3.  Delete `.env.production` immediately after.
4.  The `npm run build` script automatically picks up `.env.production`, baking the key correctly.

---

## Deployment: Persistent Old UI (Caching)

### Symptom
After redeploying with fixes, the browser continued to show an old version of the UI (old tabs, missing features) and the old "Missing Key" error.

### Root Cause
**Service Worker Caching**: The application uses a Service Worker (`sw.js`). The browser's `CacheStorage` was holding onto the old `index.html` and JS bundles. Even with a new deployment, the Service Worker served the stale content.

### Solution
1.  **Cache Version Bump**: Updated `CACHE_NAME` in `sw.js` (e.g., `zenreader-v3`).
2.  **Aggressive Unregistration**: Added code to `index.html` to explicitly unregister all existing service workers on load:
    ```javascript
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (let registration of registrations) {
        registration.unregister();
      }
    });
    ```
3.  **Forced Activation**: Updated `sw.js` `activate` event to delete all old caches that don't match the new version name.

---

## "Smart Format" Language Translation Issue

### Symptom
The "Smart Format" feature was translating English YouTube videos/text into Spanish, even when the target language was set to "Original".

### Root Cause
The Gemini prompt wasn't strict enough about language preservation. The model sometimes hallucinated a need to translate or defaulted to a training bias.

### Solution
**Hardened Prompts in `geminiService.ts`**:
Updated the system instructions to explicitly forbid translation unless requested.
*   *Before*: "Answer in the same language as the text."
*   *After*: "**LANGUAGE REQUIREMENT**: You MUST write your entire response in the **EXACT SAME LANGUAGE** as the source text/video. Do NOT translate."

*(Note: This fix is currently verified in Local Dev but pending next production deployment).*
