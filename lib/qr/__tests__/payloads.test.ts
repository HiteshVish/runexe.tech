import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildTextPayload,
  buildUpiPayload,
  buildUrlPayload,
  buildWhatsappPayload,
  buildWifiPayload,
  escapeWifiField,
} from "../payloads";

describe("buildUrlPayload", () => {
  it("prepends https when scheme missing", () => {
    const r = buildUrlPayload("example.com/path");
    assert.equal(r.errors.length, 0);
    assert.equal(r.payload, "https://example.com/path");
  });

  it("rejects empty", () => {
    assert.ok(buildUrlPayload("  ").errors.length);
  });
});

describe("buildWifiPayload", () => {
  it("escapes special characters in password", () => {
    const raw = 'foo;bar\\test"';
    assert.equal(escapeWifiField(raw), 'foo\\;bar\\\\test\\"');
    const r = buildWifiPayload("CafeNet", raw, "WPA", false);
    assert.equal(r.errors.length, 0);
    assert.match(r.payload!, /P:foo\\;bar\\\\test\\";/);
  });

  it("uses nopass without password", () => {
    const r = buildWifiPayload("Open", "", "nopass", false);
    assert.equal(r.errors.length, 0);
    assert.match(r.payload!, /T:nopass/);
    assert.doesNotMatch(r.payload!, /P:/);
  });
});

describe("buildWhatsappPayload", () => {
  it("normalizes +91 spaced number", () => {
    const r = buildWhatsappPayload("91", "+91 98765-43210", "Hi");
    assert.equal(r.errors.length, 0);
    assert.equal(r.payload, "https://wa.me/919876543210?text=Hi");
  });
});

describe("buildUpiPayload", () => {
  it("builds without amount", () => {
    const r = buildUpiPayload("shop@okhdfcbank", "My Shop", "", "");
    assert.equal(r.errors.length, 0);
    assert.match(r.payload!, /pa=shop%40okhdfcbank/);
    assert.match(r.payload!, /pn=/);
    assert.doesNotMatch(r.payload!, /am=/);
  });

  it("includes amount when valid", () => {
    const r = buildUpiPayload("shop@okhdfcbank", "Name", "99.50", "Note");
    assert.equal(r.errors.length, 0);
    assert.match(r.payload!, /am=99.50/);
  });

  it("rejects invalid VPA", () => {
    assert.ok(buildUpiPayload("not-valid", "Name", "", "").errors.length);
  });

  it("rejects bad amount decimals", () => {
    assert.ok(buildUpiPayload("shop@okhdfcbank", "Name", "1.234", "").errors.length);
  });
});

describe("buildTextPayload", () => {
  it("keeps UTF-8 text", () => {
    const r = buildTextPayload("नमस्ते");
    assert.equal(r.payload, "नमस्ते");
  });
});