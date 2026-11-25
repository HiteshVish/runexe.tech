import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeText, countGraphemes } from "../stats";

describe("analyzeText", () => {
  it("counts English words", () => {
    assert.equal(analyzeText("hello world").words, 2);
  });

  it("empty is zero", () => {
    const s = analyzeText("   ");
    assert.equal(s.words, 0);
    assert.equal(s.charsWithSpaces, 3);
  });

  it("counts Hindi words", () => {
    assert.ok(analyzeText("नमस्ते दुनिया").words >= 2);
  });
});

describe("countGraphemes", () => {
  it("counts emoji as one grapheme", () => {
    assert.ok(countGraphemes("👋🏽") >= 1);
    assert.ok(countGraphemes("a👋b") >= 3);
  });
});