import { buildInvoice, formatMoney, invoicePreviewHtml, parseInvoiceFormData } from "@/lib/invoice";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { post, files } = await parseInvoiceFormData(request);
    const { data: invoice, errors } = buildInvoice(post, files);

    return Response.json(
      {
        ok: true,
        errors,
        html: invoicePreviewHtml(invoice),
        totals: {
          subtotal: formatMoney(invoice.subtotal, invoice.currency),
          tax: formatMoney(invoice.tax_total, invoice.currency),
          grand_total: formatMoney(invoice.grand_total, invoice.currency),
          balance_due: formatMoney(invoice.balance_due, invoice.currency),
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (ex) {
    console.error("Invoice preview failed:", ex);
    return Response.json({ ok: false, errors: ["Preview failed. Please try again."] }, { status: 500 });
  }
}