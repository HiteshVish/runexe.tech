# PDF Studio — status

Last updated: 2026-11-25

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
| Protect / Unlock PDF | Blocked | Need MIT/Apache browser encryption engine (e.g. qpdf-WASM). pdf-lib ignoreEncryption is not decryption. |
| Secure redaction | Blocked | Whiteout is visual cover only. |
| Original PDF text edit | Blocked | Overlay text ≠ content stream edit. |
| PDF ↔ Word | Blocked | No approved conversion engine. |
| OCR | Gated | Tesseract reserved in `phase3.ts`; not published. |
| MuPDF.js | Rejected | AGPL — not used. |

## Dependencies added

- `pdfjs-dist`, `pdf-lib`, `@pdf-lib/fontkit`
- `konva`, `react-konva`
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `zustand`
- Reused `jszip`

## Test results

`npm run test:pdf-studio` — 12/12 pass (page ranges, validate, coords, history)

## Build

`npm run build` — success (2026-11-25)

## Known limitations

- Compression presets other than “lossless” rasterize pages (labeled in UI).
- Crop shrinks page dimensions; does not securely erase hidden content.
- Metadata strip is limited to common info fields — not full sanitization.
- Large PDFs may be slow; soft warn above 40 MB, hard reject above 80 MB.
- Form filling supports common AcroForm fields; XFA unsupported.
- Virtualization is light (thumbs capped at 80); continuous scroll renders all pages in view list.
