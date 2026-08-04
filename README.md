<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0e397ca8-5128-4f82-8c6f-489697633089

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set a long, unique `MANAGER_PASSWORD`.
   Set `DISABLE_FIRESTORE=true` for local JSON-only development. Cloud deployments
   using Firestore must provide Google application-default credentials.
3. Run the app:
   `npm run dev`

The manager portal prompts for `MANAGER_PASSWORD`. Firestore browser access is
disabled; all reads and writes go through the server.

The venue assistant runs locally using built-in hall information and requires no
Gemini or other AI API key. For shared cross-device data, deploy with Firestore
enabled (`DISABLE_FIRESTORE=false`) and Google application-default credentials.
