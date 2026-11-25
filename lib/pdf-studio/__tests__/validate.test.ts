import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hasPdfMagic, validatePdfBytes } from "../validate";

describe("validatePdfBytes", () => {
  it("rejects empty", () => {
    const r = validatePdfBytes(new Uint8Array());
    assert.equal(r.ok, false);
  });

  it("accepts magic", () => {
    const bytes = new TextEncoder().encode("%PDF-1.4\n%%EOF");
    assert.equal(hasPdfMagic(bytes), true);
    const r = validatePdfBytes(bytes);
    assert.equal(r.ok, true);
  });

  it("detects encrypt marker", () => {
    const bytes = new TextEncoder().encode("%PDF-1.4\n/Encrypt << /Filter /Standard >>\n");
    const r = validatePdfBytes(bytes);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.encrypted, true);
  });
});