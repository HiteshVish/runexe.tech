# RunExe PDF Studio — implementation plan

Browser-only PDF editor at `/tools/pdf-editor`. Architecture mirrors existing RunExe tools (`lib/pdf-studio/` + `components/tools/PdfStudio/`).

## Stack

- **Render:** pdfjs-dist (client-only, version-matched worker)
- **Mutate/export:** pdf-lib + @pdf-lib/fontkit
- **Overlays:** Konva / react-konva (separate from PDF.js canvas)
- **Page DnD:** @dnd-kit
- **State:** Zustand
- **ZIP:** existing jszip

## Privacy

No automatic uploads. No document bytes, filenames, passwords, or signatures in logs or analytics. Processing stays in the browser for all published Phase 1–2 features.

## Phases

### Phase 1 (ship first)

Upload/validate, render, page organize, merge, split, text/image overlays, annotations, whiteout (visual cover), e-signatures, watermark, page numbers, AcroForm fill, undo/redo, export.

### Phase 2

Real compression, PDF↔image, image→PDF, crop, metadata. Protect/unlock blocked until approved encryption engine.

### Phase 3 (capability-gated)

OCR, original text edit, secure redaction, Word conversion, compare, certificate signatures — unpublished until verified.

## Routes

Main: `/tools/pdf-editor`

Phase 1 landings: merge-pdf, split-pdf, organize-pdf, rotate-pdf, remove-pdf-pages, sign-pdf, add-text-to-pdf, watermark-pdf

Phase 2: compress-pdf, jpg-to-pdf, pdf-to-jpg, crop-pdf (when ready)

Not indexed until ready: protect-pdf, unlock-pdf, ocr-pdf, pdf-to-word, word-to-pdf, redact-pdf

## Non-goals

- Server-side PDF processing for Studio
- Thin compress-to-Nkb duplicate landings
- Claiming whiteout as secure redaction
