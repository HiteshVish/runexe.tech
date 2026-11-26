# PDF Studio — status

Last updated: 2026-11-26

## Completed

- [x] Docs + scaffold (deps, ToolKey, route shell)
- [x] Upload / validate / workspace chrome / PDF.js render
- [x] Page management + merge + split + export
- [x] Overlay editing (text, image, annotations, signature)
- [x] Undo/redo + export hardening
- [x] Watermark, numbering, AcroForm fill
- [x] Phase 1 SEO landings + unit tests + build
- [x] Phase 2 utilities (compress, PDF↔image, image→PDF, crop, metadata)
- [x] Phase 3 capability registry (gated; unpublished)
- [x] Canva-like UI polish (canvas-first grid, icon toolbars, filmstrip, mobile dock)
- [x] Tool correctness (pan, fullscreen, crop export, drag shapes, pointer/touch)
- [x] Per-landing unique FAQ / HowTo / BreadcrumbList / WebApplication URL + Twitter images

## Available routes

| Route | Mode |
|-------|------|
| `/tools/pdf-editor` | Full editor |
| `/tools/merge-pdf` | Merge |
| `/tools/split-pdf` | Split |
| `/tools/organize-pdf` | Organize |
| `/tools/rotate-pdf` | Rotate |
| `/tools/remove-pdf-pages` | Remove pages |
| `/tools/sign-pdf` | Electronic signature |
| `/tools/add-text-to-pdf` | Add text |
| `/tools/watermark-pdf` | Watermark |
| `/tools/compress-pdf` | Compress |
| `/tools/jpg-to-pdf` | Image to PDF |
| `/tools/pdf-to-jpg` | PDF to images |
| `/tools/crop-pdf` | Crop |

## Blockers (unpublished)

| Feature | Status | Notes |
|---------|--------|-------|
| Protect / Unlock PDF | Blocked | Need MIT/Apache browser encryption engine |
| Secure redaction | Blocked | Whiteout is visual cover only |
| Original PDF text edit | Blocked | Overlay text ≠ content stream edit |
| PDF ↔ Word | Blocked | No approved conversion engine |
| OCR | Gated | Not published |
| MuPDF.js | Rejected | AGPL — not used |

## Test results

`npm run test:pdf-studio` — 12/12 pass

## Build

`npm run build` — see latest CI/local run

## Known limitations

- Compression presets other than “lossless” rasterize pages (labeled in UI).
- Crop applies a crop box; does not securely erase hidden content.
- Metadata strip is limited to common info fields.
- Continuous scroll still renders listed pages (thumbs capped at 80).
- No Canva cloud/templates/collaboration (by design — browser-only).
