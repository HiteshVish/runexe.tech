import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import { buildInvoice, invoiceFilename, parseInvoiceFormData, renderInvoice } from "@/lib/invoice";
import type { InvoiceData } from "@/lib/invoice";

export const runtime = "nodejs";
export const maxDuration = 60;

const PAGE_MARGIN_MM = { top: 14, right: 14, bottom: 18, left: 14 };

function fullPrintHtml(inv: InvoiceData): string {
  const rendered = renderInvoice(inv);
  const m = PAGE_MARGIN_MM;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${rendered.css}
@page { size: A4; margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; }
html, body { margin: 0; padding: 0; background: #fff; }
</style></head><body>${rendered.body}</body></html>`;
}

function wantsJsonResponse(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  return accept.includes("application/json");
}

async function launchBrowser() {
  const launchOpts = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
  };
  try {
    const executablePath = await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar`,
    );
    return puppeteer.launch({ ...launchOpts, executablePath });
  } catch (primary) {
    const local =
      process.env.CHROME_PATH ||
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      (process.platform === "linux" ? "/usr/bin/google-chrome" : undefined);
    if (!local) throw primary;
    return puppeteer.launch({
      ...launchOpts,
      executablePath: local,
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
}

export async function POST(request: Request) {
  const { post, files } = await parseInvoiceFormData(request);
  const { data: invoice, errors, issues } = buildInvoice(post, files);

  if (errors.length > 0) {
    if (wantsJsonResponse(request)) {
      return Response.json({ ok: false, errors, issues }, { status: 422 });
    }
    return new Response(
      `<!DOCTYPE html><html><body><h1>Please fix these details</h1><ul>${errors.map((e) => `<li>${e}</li>`).join("")}</ul><a href="/tools/invoice">Back</a></body></html>`,
      { status: 422, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const html = fullPrintHtml(invoice);
  const filename = invoiceFilename(invoice);

  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: `${PAGE_MARGIN_MM.top}mm`,
        right: `${PAGE_MARGIN_MM.right}mm`,
        bottom: `${PAGE_MARGIN_MM.bottom}mm`,
        left: `${PAGE_MARGIN_MM.left}mm`,
      },
    });

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (ex) {
    console.error("Invoice PDF generation failed:", ex);
    if (wantsJsonResponse(request)) {
      return Response.json(
        { ok: false, errors: ["The PDF could not be generated. Please try again."] },
        { status: 500 },
      );
    }
    return new Response("The PDF could not be generated.", { status: 500 });
  } finally {
    await browser?.close();
  }
}
