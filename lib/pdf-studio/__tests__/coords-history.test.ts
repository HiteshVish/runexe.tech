import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { topLeftToPdfLib, snap } from "../coords";
import { emptyHistory, pushHistory, undoHistory, redoHistory } from "../history";
import { defaultPageNumbers } from "../types";

describe("coords", () => {
  it("converts top-left to pdf-lib", () => {
    const r = topLeftToPdfLib(10, 20, 100, 50, 800);
    assert.equal(r.x, 10);
    assert.equal(r.y, 730);
    assert.equal(r.width, 100);
    assert.equal(r.height, 50);
  });

  it("snaps", () => {
    assert.equal(snap(13, 10), 10);
    assert.equal(snap(16, 10), 20);
  });
});

describe("history", () => {
  const snap = () => ({
    name: "a.pdf",
    pageOrder: ["p1"],
    pages: {},
    objects: {},
    formValues: [],
    pageNumbers: defaultPageNumbers(),
  });

  it("undo redo", () => {
    let h = emptyHistory();
    const a = snap();
    h = pushHistory(h, a);
    const current = { ...snap(), name: "b.pdf" };
    const u = undoHistory(h, current);
    assert.ok(u);
    assert.equal(u!.snapshot.name, "a.pdf");
    const r = redoHistory(u!.hist, u!.snapshot);
    assert.ok(r);
    assert.equal(r!.snapshot.name, "b.pdf");
  });

  it("coalesces", () => {
    let h = emptyHistory();
    h = pushHistory(h, snap(), "drag-1");
    h = pushHistory(h, snap(), "drag-1");
    assert.equal(h.past.length, 1);
  });
});