# CareerCoach Gemini API test

This is a minimal test project to verify you can call the Google Generative Language (Gemini) API from a simple backend and serve a static UI.

Files:

- `server.js` — Express server with `POST /api/gemini` which proxies to Google's Generative Language endpoint
- `public/index.html` and `public/app.js` — static client to send a prompt and show the response
- `.env.example` — shows the `GOOGLE_API_KEY` environment variable

Quick start (Windows PowerShell):

1. Copy `.env.example` to `.env` and add your API key:

   $env:GOOGLE_API_KEY = 'YOUR_KEY_HERE'

   Or create a `.env` file with:
   GOOGLE_API_KEY=YOUR_KEY_HERE

2. Install dependencies:

   Set-Location -Path 'e:\Project field\CareerCoach'; npm install

3. Start the server:

   Set-Location -Path 'e:\Project field\CareerCoach'; npm start

4. Open http://localhost:3000 in your browser. Enter a prompt and click Send.

Notes:

- The server uses the REST endpoint `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=API_KEY` which is the (documented) Google Generative Language REST API pattern (replace the model if you need a different one).
- Keep your API key secret. For production, use Google Cloud IAM/service accounts and server-side authentication.

If you'd like, I can:

- Add an example that uses OAuth2/service account (more secure), or
- Swap to the official Google Cloud client library for generative models.
