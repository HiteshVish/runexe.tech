# Invoice Generator (International + India GST)

A free, browser-based invoice generator that is part of the RunExe Technology tools
(`/tools/invoice/`). Fill in the form, watch the live A4 preview, and download a
multi-page PDF. It works for businesses in any country and has full support for
Indian GST tax invoices.

## Invoice types

| Mode | For | What it does |
| --- | --- | --- |
| **No tax** | Hong Kong and other regions without sales tax | Titled "Invoice", HKD by default, optional Business Registration No. |
| **India GST** | Indian GST-registered sellers | Titled "Tax Invoice". CGST + SGST (or UTGST) for intra-state and IGST for inter-state supplies, picked automatically from the seller GSTIN state vs. place of supply. HSN/SAC, reverse charge, rate-wise tax summary |
| **India export** | Indian sellers billing overseas clients | Place of supply "96 - Other Countries", export under LUT (0% IGST, ARN required) or with IGST paid |
| **VAT / other tax** | UAE, UK, EU, Singapore, Australia and so on | Your own tax name (VAT, GST, Sales Tax), tax-number label (TRN, VAT No., ABN) and per-line rates |

Common to every mode:

- 10 currencies (HKD, USD, INR, EUR, GBP, SGD, AED, CNY, AUD, CAD) with the amount in words
  (Indian lakh/crore wording for INR)
- Per-line discount and tax rate, other charges, round-off, deposit / balance due
- Ship-to address, payment terms with an automatic due date, and PO / reference number
- Bank, SWIFT, IBAN, IFSC, UPI and FPS payment details (fields depend on the mode)
- Logo and signature images, embedded in memory (nothing is written to disk)
- 4 PDF designs (Classic, Modern, Sidebar, Minimal ledger) with any accent colour
- Long invoices flow over several pages: the table header repeats, the totals block is
  never split, and every page shows "Page X of Y"
- The seller profile, bank details and last invoice number are remembered in the browser
  (localStorage), and the next invoice number is suggested automatically

## Requirements

- PHP 8.1+ with `mbstring`, `gd` and `curl` (curl is only needed for the lookups)
- Composer
- Apache with `AllowOverride All` (the bundled `.htaccess` blocks internal folders)

## Setup

```bash
cd tools/invoice
composer install --no-dev --optimize-autoloader
```

`vendor/` is git-ignored, so run this after every fresh deploy.

### Defaults by visitor location

On a first visit (no saved profile) the form picks the invoice type, currency, tax name,
tax rate, tax-number label and seller country from the visitor's IP country. India gets
India GST in INR, Hong Kong gets no tax in HKD, Germany gets VAT 19% in EUR, the UAE gets
VAT 5% (TRN) in AED, the US gets no tax in USD, and so on. Countries without a preset get
no tax in USD. The presets live in `COUNTRY_PRESETS` and `EU_VAT_RATES` in `app.js`. A
saved profile always wins, and "Clear all" goes back to the location defaults.

The country comes from the free [DB-IP](https://db-ip.com) "IP to Country Lite" database,
read locally, so there's no API call, key or quota, and no visitor IP leaves the server.
Its CC BY 4.0 licence requires the "IP geolocation by DB-IP" link shown on the form.
Download it once, then refresh it monthly from cron:

```bash
php bin/update-geoip.php
# crontab: 15 3 2 * * /usr/bin/php /path/to/tools/invoice/bin/update-geoip.php
```

Without the database the form falls back to the Hong Kong defaults. Add `?country=DE`
(any two-letter code) to the URL to preview another country's defaults.

### GST number lookup (optional)

When a valid GSTIN is entered and the name or address is still empty, the form prefills
the legal name, principal address and state from GST records. The "Prefill" button does
the same on demand and overwrites what is there. A card under the GSTIN shows the
registration status (with a warning if it is cancelled or suspended) and lets you switch
between legal and trade name and between the business's registered addresses.

The defaults in `gst-config.example.php` are set up for the RapidAPI "GST Verification
API". To enable it, create `gst-config.php` with just:

```php
<?php
return [
    'enabled' => true,
    'api_key' => 'YOUR_RAPIDAPI_KEY',
];
```

For another provider, also override `endpoint` (with `{gstin}` as a placeholder),
the auth settings and the dot-paths under `map`.

The key only ever lives on the server. `gst-config.php` is git-ignored and returns 404
from the web. Keep it readable only by the owner and Apache (`chgrp www-data` + `chmod 640`).

The RapidAPI free plan allows 100 requests a month, and failed lookups count. To protect
that quota, results are cached for 30 days and "not found" answers for a day. Provider
calls are also capped at 10 per visitor IP per hour and 15 per day in total
(`rate_limit_per_hour`, `daily_limit`). When a limit is hit, users see a message and can
type the details manually.

### Free lookups (always on, no API key)

`lookup.php` proxies three free public services so the browser never calls them directly:

| Field | Service | What it does |
|---|---|---|
| IFSC | [Razorpay IFSC](https://ifsc.razorpay.com) | Shows bank, branch and city. Fills an empty "Bank name" with "Bank, Branch" and an empty SWIFT field (India export) |
| PIN code in an Indian address | [India Post](https://api.postalpincode.in) | Shows district and state, sets an empty state select (and the place of supply for the client), warns when the PIN and the selected state don't match, and offers to add the district and state to the address |
| EU VAT number (client or own tax ID) | [EU VIES](https://ec.europa.eu/taxation_customs/vies/) | Says whether the number is valid. Fills an empty name, address and country when the member state shares them (Germany, for example, doesn't) |

Results are cached on the server (30 days, VAT checks 1 day, "not found" 1 day) and
provider calls are capped at 60 per visitor IP per hour. If a service is down the form
just skips the hint.

## File structure

```text
tools/invoice/
├── index.php               # Form UI, live preview panel
├── app.js                  # Form behaviour, GSTIN checks, preview, samples, saved profile
├── preview.php             # POST -> JSON { html, errors, totals } for the live preview
├── generate_pdf.php        # POST -> PDF (inline), or a friendly error page
├── gst-lookup.php          # GET ?gstin= -> JSON business details (server-side proxy)
├── lookup.php              # GET ?type=ifsc|pincode|vat&q= -> JSON from free public APIs
├── gst-config.example.php  # GST provider settings template
├── lib/
│   ├── regions.php         # States, currencies, modes, GSTIN checksum, number formatting, amount in words
│   ├── Invoice.php         # Input validation and all invoice calculations
│   ├── render.php          # mPDF setup, preview wrapper, error page
│   ├── lookup-http.php     # JSON responses, cache dir, rate counters, HTTP GET for the lookups
│   ├── geo.php             # Visitor country from the local DB-IP database
│   └── gst-config-loader.php
├── templates/
│   ├── partials.php        # Shared blocks (parties, items, totals, tax summary, bank, terms) and base CSS
│   ├── classic.php
│   ├── modern.php
│   ├── sidebar.php
│   └── minimal.php
├── bin/update-geoip.php    # CLI: download/refresh the country database (monthly cron)
├── data/                   # dbip-country-lite.mmdb (git-ignored, blocked from the web)
├── composer.json           # mpdf/mpdf, maxmind-db/reader
└── .htaccess               # Blocks lib/, templates/, vendor/, data/, bin/, config and composer files
```

## Adding a template

Create `templates/{name}.php` with a `template_{name}(array $inv): array` function that
returns `['css' => ..., 'body' => ...]`, built from the partials. Then add the name to
`Invoice::TEMPLATES` and add a radio card in `index.php`. Keep layouts table-based:
mPDF has no flexbox/grid support and ignores margins on elements inside table cells, so
use cell padding instead.
