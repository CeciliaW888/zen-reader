# Security Guide for ZenReader

## Architecture: Backend Proxy

ZenReader uses a **backend proxy** architecture. The Gemini API key is stored server-side only and is **never exposed to the browser**.

- **Where is the Key?** Stored in Google Cloud Run's environment variables and injected into the Express server process.
- **Is it visible to users?** No. Browser requests go to `/api/generate` on the same origin. The API key is added server-side before forwarding to Gemini.
- **Result:** Inspecting the browser's Network tab or Sources tab will not reveal the API key.

## If Your API Key is Compromised

1. Go to the [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
2. Delete the compromised key.
3. Generate a new API key and restrict it to the **Generative Language API**.
4. Update the environment variable in Cloud Run (or your `.env` file for local dev).
5. Redeploy the application.

## Server-Side Protections

- **Rate Limiting:** 30 requests/min per IP (via `express-rate-limit`)
- **Model Whitelist:** Only approved Gemini models are accepted
- **Body Limit:** 10MB max request size
- **Error Messages:** Stack traces are only shown in development mode

## API Key Restrictions (Google Cloud Console)

For additional protection, restrict your API key in the Cloud Console:

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials) and edit your API key.
2. Under **API restrictions**, select **Restrict key** and choose only **Generative Language API**.
3. Optionally add **Application restrictions** (HTTP referrers) to limit which domains can use the key.

## Best Practices

- Never commit `.env` files with real API keys to git
- Rotate API keys periodically
- Monitor usage in the Google Cloud Console
- Use Google Cloud Secret Manager for production deployments (see CLAUDE.md for setup instructions)
