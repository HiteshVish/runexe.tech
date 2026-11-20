# runexe.tech (Next.js)

Next.js 15 App Router port of the RunExe Technology site and tools. Legacy HTML/PHP sources are preserved under [`legacy/`](legacy/) for reference.

## Develop

```bash
cp .env.example .env.local   # add TESTMAIL_* and optional GST_* keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path | Description |
|------|-------------|
| `/` | Marketing home (GSAP, Lenis, Three.js) |
| `/tools/json-formatter` | Client-side JSON tool |
| `/tools/tempmail` | Temp mail UI + `/api/tempmail` |
| `/tools/invoice` | Invoice generator + `/api/invoice/*` |

## Environment

See [`.env.example`](.env.example). For GST lookup: `GST_LOOKUP_ENABLED=true`, `GST_RAPIDAPI_KEY`, optional `GST_RAPIDAPI_HOST`.

Optional GeoIP: `npm run update-geoip` writes `lib/invoice/data/dbip-country-lite.mmdb`.

## Deploy (Vercel)

- Set env vars in the Vercel project.
- PDF generation uses `@sparticuz/chromium-min` on `/api/invoice/pdf` (see [`vercel.json`](vercel.json)).

## Build

```bash
npm run build
npm run start
```