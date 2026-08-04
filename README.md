<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# I-Madina Hall Booking System

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Link the Neon project with `npx neon@latest link` so `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` are pulled into `.env`.
3. Set a long, unique `MANAGER_PASSWORD` in `.env`.
4. Apply migrations with `npm run db:migrate`.
5. Run the app:
   `npm run dev`

The manager portal prompts for `MANAGER_PASSWORD`. All persistent booking,
notification, payment, and hall-image metadata is stored in Neon Postgres.

The venue assistant runs locally using built-in hall information and requires no
Gemini or other AI API key.

## Vercel deployment

Set `MANAGER_PASSWORD` and the pooled Neon `DATABASE_URL`, and connect a public
Vercel Blob store so `BLOB_READ_WRITE_TOKEN` is available. Neon stores image
metadata while Blob stores uploaded image files. The `/api/*` rewrite sends API
requests to the Express Vercel Function while other requests use the Vite frontend.
