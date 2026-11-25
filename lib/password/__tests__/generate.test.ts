import "./crypto-polyfill";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CHARSET } from "../constants";
import { buildCharset, generatePassword } from "../generate";

const base = {
  length: 16,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
  customSymbols: "",
  noRepeat: false,
};

describe("generatePassword", () => {
  it("returns exact length", () => {
    const r = generatePassword({ ...base, length: 24 });
    assert.equal(r.error, undefined);
    assert.equal(r.value.length, 24);
  });

  it("includes each enabled category", () => {
    const r = generatePassword({ ...base, length: 32 });
    assert.ok(/[A-Z]/.test(r.value));
    assert.ok(/[a-z]/.test(r.value));
    assert.ok(/[0-9]/.test(r.value));
    assert.ok(/[!@#$]/.test(r.value));
  });

  it("excludes ambiguous when requested", () => {
    const r = generatePassword({ ...base, length: 64, excludeAmbiguous: true, symbols: false });
    assert.ok(!/[O0l1I|]/.test(r.value));
  });

  it("errors when no-repeat pool too small", () => {
    const r = generatePassword({
      ...base,
      length: 100,
      upper: true,
      lower: false,
      digits: false,
      symbols: false,
      noRepeat: true,
    });
    assert.ok(r.error);
  });

  it("buildCharset fails with no categories", () => {
    const b = buildCharset({
      ...base,
      upper: false,
      lower: false,
      digits: false,
      symbols: false,
    });
    assert.ok(b.error);
  });
});