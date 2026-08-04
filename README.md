# I-Madina Hall Booking System

A full-stack hall reservation system for I-Madina Event Space. Customers can check availability, select a hall package, receive an estimated price, and submit a booking request. Managers can review bookings, prevent scheduling conflicts, record payments, manage notifications, and maintain the hall image galleries.

## Current hall packages

| Venue | Area | Half day | Full day | Capacity |
| --- | --- | ---: | ---: | ---: |
| Alpha Hall | Entire hall | RM200 | RM400 | Up to 53 guests |
| Hall B | Side A | RM200 | RM400 | Up to 31 guests |
| Hall B | Side B | RM200 | RM400 | Up to 31 guests |
| Hall B | Full hall (Sides A + B) | RM400 | RM800 | Up to 80 chairs |

Half-day sessions are 9:00 AM–1:00 PM or 2:00 PM–6:00 PM. A full-day session is 9:00 AM–6:00 PM. The booking estimate includes selected equipment add-ons and displays a 30% deposit.

## Main features

- Real-time booking and availability checks.
- Hall B area selection for Side A, Side B, or the full hall.
- Section-aware conflict prevention: Side A and Side B may be booked independently for the same time, but a full-hall booking blocks both sides.
- Server-side price and capacity validation.
- Wednesday 9:00 AM–1:00 PM default reservation rule.
- Same-day booking restrictions and double-booking protection.
- Manager authentication using `MANAGER_PASSWORD`.
- Booking approval, rejection, deletion, payment tracking, notifications, and printable booking tickets.
- Persistent hall photo upload, replacement, deletion, ordering, cover selection, and editable display names.
- Offline venue assistant that uses built-in venue information and requires no Gemini or other AI API key.

## Technology

- React 19, TypeScript, Vite, and Tailwind CSS
- Express API bundled as a Vercel Function
- Neon Postgres with Drizzle ORM
- Vercel Blob for manager-uploaded hall images
- Local JSON fallback for local development when Postgres is not configured

Neon stores bookings, notifications, payments, hall image URLs, image ordering, and image display names. Vercel Blob stores uploaded image files. Static default images remain under `public/images`.

## Local setup

### Requirements

- Node.js
- npm
- A Neon project for persistent data

### Installation

```powershell
npm install
Copy-Item .env.example .env
```

Link the existing Neon project and pull its connection variables:

```powershell
npx neon@latest link
npx neon@latest env pull --file .env
```

Edit `.env` and replace the manager password placeholder with a long unique password. Never commit `.env`.

```dotenv
MANAGER_PASSWORD="your-long-random-manager-password"
DATABASE_URL="your-pooled-neon-connection-string"
DATABASE_URL_UNPOOLED="your-direct-neon-connection-string"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

- `DATABASE_URL` is the pooled connection used by the application.
- `DATABASE_URL_UNPOOLED` is the direct connection used by Drizzle migrations.
- `BLOB_READ_WRITE_TOKEN` is required for persistent image uploads. Without it, local development stores uploaded images under `public/uploads`; Vercel deployments reject uploads rather than pretending they were saved.

Apply the database migration and start the application:

```powershell
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend and Express API through `server.ts` |
| `npm run build` | Build the frontend and bundle the production server |
| `npm start` | Run the built production server |
| `npm run lint` | Run TypeScript validation without emitting files |
| `npm run db:generate` | Generate a Drizzle migration after a schema change |
| `npm run db:migrate` | Apply pending Drizzle migrations |
| `npm run db:import-json` | Import legacy local JSON records into Neon |

Before deploying a change, run:

```powershell
npm run lint
npm run build
```

## Manager portal

The manager portal uses the value of `MANAGER_PASSWORD`. Manager-only requests send it in the `x-manager-password` header. The password is held in browser session storage after a successful login and is not embedded in the frontend bundle.

The photo manager supports:

- Uploading or replacing the cover photo.
- Adding, replacing, and deleting gallery images.
- Moving gallery images earlier or later.
- Promoting a gallery image to the cover.
- Editing each gallery image's customer-facing display name.
- Resetting a hall gallery to the bundled defaults.

For Hall B, the default image mapping is:

- Hall View 1: Side A
- Hall View 2: Side B
- Panoramic view: Full Hall B (Sides A + B)

## Booking and data rules

- New Alpha Hall bookings use RM200 half-day or RM400 full-day.
- New Hall B bookings must include `side-a`, `side-b`, or `full`.
- Legacy Hall B bookings without an area are treated as full-hall bookings to prevent accidental overlaps.
- Side bookings are limited to 31 guests; full Hall B bookings are limited to 80.
- Prices and the 30% deposit are recalculated by the server. Client-submitted totals are not trusted.
- Existing historical booking totals are preserved when pricing changes.
- Booking creation is serialized by hall and date in Postgres to prevent simultaneous Vercel instances from accepting conflicting reservations.

## Vercel deployment

The repository includes `vercel.json` and `api/index.js`. Requests under `/api/*` are routed to the bundled Express function; all other requests serve the Vite application.

In the Vercel project, configure these Production and Preview environment variables:

```text
MANAGER_PASSWORD
DATABASE_URL
DATABASE_URL_UNPOOLED
BLOB_READ_WRITE_TOKEN
```

Use the pooled Neon URL for `DATABASE_URL`. Connect the Vercel Blob store to the same Vercel project so its read-write token is injected. Redeploy after changing environment variables.

Vercel normally deploys automatically after a successful push to `main`:

```powershell
git push origin main
```

## Security and operations

- Do not commit `.env`, database URLs, manager passwords, or Blob tokens.
- Use a unique manager password and rotate it if exposed.
- Keep the Neon database and Vercel environment variables connected to the same production project.
- Treat the manager portal as an administrative interface; customer booking endpoints intentionally return only limited public booking information.
- The `chext_driver.js` permissions-policy message sometimes shown in browser consoles is injected by a browser extension and is not part of this application.
