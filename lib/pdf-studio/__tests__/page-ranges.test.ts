import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePageRanges, splitEveryN, splitEveryPage } from "../page-ranges";

describe("parsePageRanges", () => {
  it("parses mixed ranges", () => {
    const r = parsePageRanges("1-3, 5, 8-10", 12);
    assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(r.indices, [0, 1, 2, 4, 7, 8, 9]);
  });

  it("rejects out of range", () => {
    const r = parsePageRanges("1-99", 5);
    assert.equal(r.ok, false);
  });

  it("rejects empty", () => {
    const r = parsePageRanges("  ", 5);
    assert.equal(r.ok, false);
  });
});

describe("split helpers", () => {
  it("splitEveryPage", () => {
    assert.deepEqual(splitEveryPage(3), [[0], [1], [2]]);
  });

  it("splitEveryN", () => {
    assert.deepEqual(splitEveryN(5, 2), [[0, 1], [2, 3], [4]]);
  });
});