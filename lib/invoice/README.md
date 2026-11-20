# RunExe Invoice Generator - TypeScript Port

TypeScript/Next.js port of the PHP invoice generator. Business logic remains identical to the original.

## Structure

```
lib/invoice/
├── index.ts               # Main exports
├── regions.ts             # Indian states, currencies, GSTIN validation
├── format.ts              # Money formatting, number-to-words
├── gst-config.ts          # GST lookup configuration
├── geo.ts                 # GeoIP country detection (mmdb-lib)
├── lookup.ts              # IFSC, PIN code, EU VAT lookups
├── gst-lookup.ts          # GST business lookup
├── invoice-build.ts       # Core invoice validation & calculation
├── render-invoice.ts      # Template rendering (4 templates)
├── form-data.ts           # FormData parser
└── data/                  # Database files
    └── dbip-country-lite.mmdb  # GeoIP database (optional)
```

## Key Modules

### invoice-build.ts
- Ports `Invoice.php` class
- Validates form data, calculates totals
- Returns `{ data, errors }` tuple
- Supports all 4 invoice modes: no_tax, in_gst, in_export, custom_tax

### render-invoice.ts
- Ports `render.php` and `templates/`
- Exports:
  - `renderInvoice(data)` → `{ css, body }`
  - `invoicePreviewHtml(data)` → standalone HTML
  - `invoiceFilename(data)` → suggested filename
- Does NOT include PDF generation (mPDF replaced by client-side/Next.js solution)

### lookup.ts
- Free, keyless lookups:
  - `lookupIfsc(code)` - Bank branch details
  - `lookupPincode(pin)` - District & state
  - `lookupVat(number)` - EU VAT validation

### gst-lookup.ts
- Server-side GST business lookup
- Configurable provider (default: RapidAPI)
- Note: Caching & rate limiting not included (implement in API route)

### geo.ts
- Uses `mmdb-lib` for GeoIP
- Gracefully returns `null` if database missing
- Database path: `lib/invoice/data/dbip-country-lite.mmdb`

## Usage

```typescript
import { buildInvoice, renderInvoice, invoicePreviewHtml } from '@/lib/invoice';

// 1. Build invoice from form data
const { data, errors } = buildInvoice(postData, filesData);

if (errors.length > 0) {
  // Handle validation errors
  return { errors };
}

// 2. Render to HTML
const html = invoicePreviewHtml(data);

// 3. Or get CSS + body separately for PDF
const { css, body } = renderInvoice(data);
```

## Dependencies

Required packages:
```bash
npm install mmdb-lib
```

Optional GeoIP database:
```bash
# Download dbip-country-lite.mmdb and place in lib/invoice/data/
```

## Differences from PHP

1. **PDF Generation**: mPDF removed. Use browser PDF export or server-side HTML→PDF library
2. **File Uploads**: Images handled as data URLs or ArrayBuffer (no temp files)
3. **Caching/Rate Limiting**: Not implemented - add in API routes
4. **Date Formatting**: Uses native Date instead of DateTimeImmutable
5. **Image Validation**: Basic size check only (full validation should be server-side)

## Integration with Next.js

### API Route Example

```typescript
// app/api/invoice/preview/route.ts
import { NextRequest } from 'next/server';
import { parseInvoiceFormData, buildInvoice, invoicePreviewHtml } from '@/lib/invoice';

export async function POST(request: NextRequest) {
  const { post, files } = await parseInvoiceFormData(request);
  const { data, errors } = buildInvoice(post, files);
  
  if (errors.length > 0) {
    return Response.json({ errors }, { status: 422 });
  }
  
  const html = invoicePreviewHtml(data);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
```

## Templates

Four templates included (identical to PHP):
1. **classic** - Clean white layout, accent title
2. **modern** - Solid accent banner, tinted cards
3. **sidebar** - Accent side panel
4. **minimal** - Fully boxed grid, formal GST look

## Configuration

GST lookup configuration (server-side only):
- Store in environment variables or config file
- See `gst-config.ts` for structure

## Testing

The TypeScript port maintains identical business logic to PHP:
- Same validation rules
- Same calculation methods
- Same rounding behavior
- Same tax calculation per rate group

Test by comparing outputs from both PHP and TypeScript versions with identical inputs.
