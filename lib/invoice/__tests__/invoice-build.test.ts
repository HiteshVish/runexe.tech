/**
 * Fixture smoke tests for invoice build (parity guard).
 */
import { buildInvoice } from "../invoice-build";

describe("buildInvoice", () => {
  it("builds a minimal no-tax invoice", () => {
    const post = {
      mode: "no_tax",
      template: "classic",
      currency: "HKD",
      invoice_number: "INV-001",
      invoice_date: "2026-01-01",
      seller: { name: "Seller Co", country: "Hong Kong" },
      buyer: { name: "Buyer Co", country: "Hong Kong" },
      items: [{ description: "Service", qty: "1", price: "100" }],
    };
    const { data, errors, issues } = buildInvoice(post);
    expect(errors).toEqual([]);
    expect(issues).toEqual([]);
    expect(data.grand_total).toBeGreaterThan(0);
    expect(data.currency).toBe("HKD");
  });

  it("returns structured issues for a missing required fields", () => {
    const { errors, issues } = buildInvoice({ mode: "no_tax", items: [{}] });
    expect(errors.length).toBeGreaterThan(0);
    expect(issues.length).toBe(errors.length);
    const numberIssue = issues.find((i) => i.field === "invoice_number");
    expect(numberIssue).toMatchObject({
      section: "invoice",
      message: "Invoice number is required.",
    });
    const itemIssue = issues.find((i) => i.message === "Add at least one line item.");
    expect(itemIssue).toMatchObject({ section: "items", field: "description" });
  });
});