/**
 * Invoice template rendering to HTML + CSS.
 * Generates both preview HTML and PDF-ready HTML (without mPDF).
 */

import type { InvoiceData, InvoiceItem, Party, TaxLine, TaxSummary } from './invoice-build';
import { formatMoney, formatNumber, formatQty, formatPct } from './format';

// HTML escaping
function e(s: string | null | undefined): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl(s: string | null | undefined): string {
  return e(s).replace(/\n/g, '<br />');
}

function money(inv: InvoiceData, amount: number): string {
  return e(formatMoney(amount, inv.currency));
}

function num(inv: InvoiceData, amount: number): string {
  return e(formatNumber(amount, inv.currency));
}

function qty(q: number): string {
  return formatQty(q);
}

function pct(p: number): string {
  return formatPct(p);
}

// Partials

interface MetaRow {
  label: string;
  value: string;
}

function metaRows(inv: InvoiceData): MetaRow[] {
  const rows: MetaRow[] = [
    { label: 'Invoice No.', value: inv.number },
    { label: 'Invoice Date', value: inv.date },
  ];
  
  if (inv.due_date) {
    rows.push({ label: 'Due Date', value: inv.due_date });
  }
  if (inv.terms_label) {
    rows.push({ label: 'Terms', value: inv.terms_label });
  }
  if (inv.reference) {
    rows.push({ label: 'Reference / PO', value: inv.reference });
  }
  if (inv.india && inv.place_of_supply) {
    rows.push({ label: 'Place of Supply', value: inv.place_of_supply });
  }
  if (inv.mode === 'in_gst') {
    rows.push({ label: 'Reverse Charge', value: inv.reverse_charge ? 'Yes' : 'No' });
  }
  rows.push({ label: 'Currency', value: inv.currency });
  
  return rows;
}

function partialMeta(inv: InvoiceData, className = 'meta'): string {
  let html = `<table class="${e(className)}">`;
  for (const { label, value } of metaRows(inv)) {
    html += `<tr><td class="meta-label">${e(label)}</td><td class="meta-value">${e(value)}</td></tr>`;
  }
  html += '</table>';
  return html;
}

function partyLines(inv: InvoiceData, p: Party, taxLabel: string): string {
  let html = '';
  
  if (p.address) {
    html += `<div>${nl(p.address)}</div>`;
  }
  if (p.country && p.address.toLowerCase().indexOf(p.country.toLowerCase()) === -1) {
    html += `<div>${e(p.country)}</div>`;
  }
  if (p.state_label) {
    html += `<div>State: ${e(p.state_label)}</div>`;
  }
  if (p.tax_id) {
    html += `<div class="strong">${e(taxLabel)}: ${e(p.tax_id)}</div>`;
  } else if (inv.mode === 'in_gst' && taxLabel === 'GSTIN') {
    html += '<div>GSTIN: Unregistered</div>';
  }
  if (inv.india && p.pan) {
    html += `<div>PAN: ${e(p.pan)}</div>`;
  }
  
  const contact = [p.email, p.phone, p.website].filter(Boolean);
  if (contact.length > 0) {
    html += `<div>${e(contact.join('  |  '))}</div>`;
  }
  
  return html;
}

function partialParty(inv: InvoiceData, title: string, p: Party, taxLabel: string): string {
  return `<div class="party-title">${e(title)}</div>` +
    `<div class="party-name">${e(p.name)}</div>` +
    `<div class="party-lines">${partyLines(inv, p, taxLabel)}</div>`;
}

function partialPartiesCells(inv: InvoiceData, cellClass = 'party'): string {
  let html = `<td class="${e(cellClass)}">` +
    partialParty(inv, 'Bill To', inv.buyer, inv.buyer_tax_id_label) + '</td>';
  
  if (inv.ship) {
    html += `<td class="${e(cellClass)}">` +
      partialParty(inv, 'Ship To', inv.ship, inv.buyer_tax_id_label) + '</td>';
  }
  
  return html;
}

function partialItems(inv: InvoiceData): string {
  const amountLabel = inv.india ? 'Taxable Value' : 'Amount';
  let html = '<table class="items"><thead><tr>' +
    '<th class="c-n">#</th><th class="c-desc">Description</th>';
  
  if (inv.show_hsn) {
    html += '<th class="c-hsn">HSN/SAC</th>';
  }
  
  html += '<th class="c-qty num">Qty</th><th class="c-rate num">Rate</th>';
  
  if (inv.show_discount) {
    html += '<th class="c-disc num">Disc.</th>';
  }
  if (inv.show_tax_rate) {
    html += `<th class="c-tax num">${e(inv.tax_name)} %</th>`;
  }
  
  html += `<th class="c-amt num">${e(amountLabel)}</th></tr></thead><tbody>`;
  
  for (let i = 0; i < inv.items.length; i++) {
    const it = inv.items[i];
    const unit = it.unit ? ' ' + e(it.unit) : '';
    html += `<tr class="${i % 2 ? 'even' : 'odd'}">` +
      `<td class="c-n">${it.n}</td>` +
      `<td class="c-desc">${nl(it.description)}</td>`;
    
    if (inv.show_hsn) {
      html += `<td class="c-hsn">${e(it.hsn)}</td>`;
    }
    
    html += `<td class="c-qty num">${qty(it.qty)}${unit}</td>` +
      `<td class="c-rate num">${num(inv, it.price)}</td>`;
    
    if (inv.show_discount) {
      html += `<td class="c-disc num">${it.discount > 0 ? pct(it.discount) : '-'}</td>`;
    }
    if (inv.show_tax_rate) {
      html += `<td class="c-tax num">${pct(it.rate)}</td>`;
    }
    
    html += `<td class="c-amt num">${num(inv, it.taxable)}</td></tr>`;
  }
  
  html += '</tbody></table>';
  return html;
}

function partialTaxSummary(inv: InvoiceData): string {
  if (!inv.india || inv.tax_summary.length === 0) {
    return '';
  }
  
  const inter = inv.is_inter;
  let html = '<table class="tax-summary"><thead><tr><th>GST Rate</th><th class="num">Taxable Value</th>';
  
  html += inter
    ? '<th class="num">IGST</th>'
    : `<th class="num">CGST</th><th class="num">${e(inv.sgst_label)}</th>`;
  
  html += '<th class="num">Total Tax</th></tr></thead><tbody>';
  
  for (const row of inv.tax_summary) {
    html += `<tr><td>${pct(parseFloat(row.rate))}</td><td class="num">${num(inv, row.taxable)}</td>`;
    
    html += inter
      ? `<td class="num">${num(inv, row.igst)}</td>`
      : `<td class="num">${num(inv, row.cgst)}</td><td class="num">${num(inv, row.sgst)}</td>`;
    
    html += `<td class="num">${num(inv, row.tax)}</td></tr>`;
  }
  
  html += '</tbody></table>';
  return html;
}

function partialTotals(inv: InvoiceData): string {
  const rows: Array<[string, number, string]> = [['Subtotal', inv.subtotal, '']];
  
  if (inv.discount_total > 0) {
    rows.push(['Discount', -inv.discount_total, '']);
  }
  if (inv.taxed && (inv.discount_total > 0 || inv.india)) {
    rows.push(['Taxable Value', inv.taxable_total, '']);
  }
  
  for (const line of inv.tax_lines) {
    rows.push([line.label, line.amount, '']);
  }
  
  if (inv.other_charges > 0) {
    rows.push([inv.other_charges_label, inv.other_charges, '']);
  }
  if (inv.round_off !== 0) {
    rows.push(['Round Off', inv.round_off, '']);
  }
  
  rows.push(['Total', inv.grand_total, 'grand']);
  
  if (inv.amount_paid > 0) {
    rows.push(['Amount Paid', -inv.amount_paid, '']);
    rows.push(['Balance Due', inv.balance_due, 'balance']);
  }
  
  let html = '<table class="totals">';
  for (const [label, amount, className] of rows) {
    html += `<tr class="${className}"><td class="t-label">${e(label)}</td>` +
      `<td class="t-value num">${money(inv, amount)}</td></tr>`;
  }
  html += '</table>';
  return html;
}

function titledBlock(title: string, content: string, titleClass = 'block-title'): string {
  return `<table class="blk"><tr><td class="blk-cell"><div class="${e(titleClass)}">${e(title)}</div>` +
    content + '</td></tr></table>';
}

function partialWords(inv: InvoiceData): string {
  return titledBlock('Amount in Words', `<div class="words">${e(inv.amount_words)}</div>`);
}

function partialPayment(inv: InvoiceData, titleClass = 'block-title', labelClass = 'b-label'): string {
  if (Object.keys(inv.bank).length === 0) {
    return '';
  }
  
  let html = '<table class="bank">';
  for (const [label, value] of Object.entries(inv.bank)) {
    html += `<tr><td class="${e(labelClass)}">${e(label)}</td><td class="b-value">${e(value)}</td></tr>`;
  }
  html += '</table>';
  
  return titledBlock('Payment Details', html, titleClass);
}

function partialNotes(inv: InvoiceData): string {
  if (!inv.notes) {
    return '';
  }
  return titledBlock('Notes', `<div class="small">${nl(inv.notes)}</div>`);
}

function keepHeadingSection(title: string, lines: string[]): string {
  const head = lines.slice(0, 3);
  const rest = lines.slice(3);
  
  let html = '<table class="keep" style="page-break-inside: avoid;"><tr><td>' +
    `<div class="block-title">${e(title)}</div><div class="small">` +
    head.map(e).join('<br />') + '</div></td></tr></table>';
  
  if (rest.length > 0) {
    html += '<div class="small">' + rest.map(e).join('<br />') + '</div>';
  }
  
  return html;
}

function partialTerms(inv: InvoiceData): string {
  let html = '';
  
  if (inv.terms) {
    html += keepHeadingSection('Terms & Conditions', inv.terms.split(/\r?\n/));
  }
  if (inv.declaration.length > 0) {
    html += keepHeadingSection('Declaration', inv.declaration);
  }
  
  return html ? `<div class="terms">${html}</div>` : '';
}

function partialSignature(inv: InvoiceData): string {
  const img = inv.signature
    ? `<img class="sig-img" src="${inv.signature}" alt="" />`
    : '&nbsp;';
  
  return '<table class="signature"><tr><td class="sig-gap"></td><td class="sig-cell">' +
    `<div class="sig-for">For ${e(inv.seller.name)}</div></td></tr>` +
    `<tr><td class="sig-gap"></td><td class="sig-space">${img}</td></tr>` +
    '<tr><td class="sig-gap"></td><td class="sig-line">Authorised Signatory</td></tr></table>';
}

function partialLogo(inv: InvoiceData, className = 'logo'): string {
  return inv.logo ? `<img class="${e(className)}" src="${inv.logo}" alt="" />` : '';
}

function partialTitle(inv: InvoiceData): string {
  let html = `<div class="doc-title">${e(inv.title.toUpperCase())}</div>`;
  if (inv.subtitle) {
    html += `<div class="doc-subtitle">${e(inv.subtitle)}</div>`;
  }
  return html;
}

function partialBottom(inv: InvoiceData, includePayment = true): string {
  const left = partialWords(inv) +
    (includePayment ? partialPayment(inv) : '') +
    partialNotes(inv);
  
  return '<table class="bottom" style="page-break-inside: avoid;"><tr>' +
    `<td class="bottom-left">${left}</td>` +
    `<td class="bottom-right">${partialTotals(inv)}${partialSignature(inv)}</td>` +
    '</tr></table>';
}

function baseCss(inv: InvoiceData): string {
  const a = inv.accent;
  return `body { font-family: dejavusans, 'DejaVu Sans', Helvetica, Arial, sans-serif; font-size: 8.6pt; color: #1f2328; line-height: 1.4; }
table { border-collapse: collapse; width: 100%; }
td, th { vertical-align: top; }
.num { text-align: right; white-space: nowrap; }
.strong { font-weight: bold; }
.small { font-size: 7.6pt; color: #4b5563; }
.muted { color: #6b7280; }
.doc-title { font-size: 22pt; font-weight: bold; color: ${a}; letter-spacing: 1pt; }
.doc-subtitle { font-size: 8pt; color: #6b7280; }
.party-title, .block-title { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8pt; color: ${a}; margin-bottom: 3pt; }
.blk-cell { padding: 9pt 0 0 0; }
.keep td { padding: 9pt 0 0 0; }
.party-name { font-size: 10pt; font-weight: bold; margin-bottom: 2pt; }
.party-lines { font-size: 8pt; color: #374151; }
.meta td { padding: 1.5pt 0; font-size: 8pt; }
.meta-label { color: #6b7280; padding-right: 8pt; white-space: nowrap; }
.meta-value { font-weight: bold; text-align: right; }
.items { margin-top: 12pt; }
.items th { font-size: 7.4pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4pt; padding: 6pt 5pt; text-align: left; }
.items th.num { text-align: right; }
.items td { padding: 6pt 5pt; border-bottom: 0.4pt solid #e5e7eb; }
.c-n { width: 5%; color: #6b7280; }
.c-hsn { width: 11%; }
.c-qty { width: 11%; }
.c-rate { width: 13%; }
.c-disc, .c-tax { width: 8%; }
.c-amt { width: 15%; }
.tax-summary { margin-top: 10pt; width: 100%; }
.tax-summary th { font-size: 7pt; text-transform: uppercase; color: #6b7280; padding: 3pt 5pt; border-bottom: 0.6pt solid #d1d5db; text-align: left; }
.tax-summary th.num { text-align: right; }
.tax-summary td { font-size: 7.8pt; padding: 3pt 5pt; border-bottom: 0.4pt solid #eef0f2; }
.bottom { margin-top: 12pt; }
.bottom-left { width: 55%; padding-right: 14pt; }
.bottom-right { width: 45%; }
.totals td { padding: 3.5pt 6pt; font-size: 8.6pt; }
.t-label { color: #4b5563; }
.totals tr.grand td { font-size: 11pt; font-weight: bold; }
.totals tr.balance td { font-weight: bold; }
.words { font-size: 8pt; font-weight: bold; }
.bank td { padding: 1.2pt 0; font-size: 7.8pt; }
.b-label { color: #6b7280; width: 32%; }
.sig-gap { width: 35%; }
.sig-cell { padding-top: 14pt; text-align: right; }
.sig-for { font-size: 8pt; font-weight: bold; }
.sig-space { height: 16mm; text-align: right; vertical-align: bottom; padding: 3pt 0; }
.sig-img { max-height: 20mm; max-width: 45mm; }
.sig-line { font-size: 7.4pt; color: #6b7280; border-top: 0.5pt solid #9ca3af; padding-top: 2pt; text-align: right; }
.terms { margin-top: 6pt; }
.logo { max-height: 18mm; max-width: 55mm; }`;
}

function pageFooterText(inv: InvoiceData): string {
  return `${e(inv.seller.name)}  |  ${e(inv.title[0].toUpperCase() + inv.title.slice(1).toLowerCase())} ${e(inv.number)}`;
}

// Template implementations

function templateClassic(inv: InvoiceData): { css: string; body: string } {
  const a = inv.accent;
  const on = inv.on_accent;
  const tint = inv.accent_tint;
  const s = inv.seller;

  const css = baseCss(inv) + `
.head td { vertical-align: top; }
.seller-name { font-size: 13pt; font-weight: bold; margin: 4pt 0 2pt; }
.head-right { text-align: right; width: 42%; }
.head-right .meta { width: 100%; margin-top: 8pt; }
.rule { border-top: 1.4pt solid ${a}; margin: 12pt 0 10pt; height: 1pt; }
.parties td.party { width: 50%; padding-right: 14pt; }
.items th { background-color: ${a}; color: ${on}; }
.items tr.even td { background-color: ${tint}; }
.totals tr.grand td { background-color: ${a}; color: ${on}; }
.totals tr.balance td { border-top: 0.8pt solid ${a}; color: ${a}; }
.tax-summary th { color: ${a}; }`;

  const logo = partialLogo(inv);
  const body = `<table class="head"><tr><td>` +
    logo +
    `<div class="seller-name">${e(s.name)}</div>` +
    `<div class="party-lines">${partyLines(inv, s, inv.tax_id_label)}</div>` +
    `</td><td class="head-right">${partialTitle(inv)}${partialMeta(inv)}</td></tr></table>` +
    '<div class="rule"></div>' +
    `<table class="parties"><tr>${partialPartiesCells(inv)}</tr></table>` +
    partialItems(inv) +
    partialTaxSummary(inv) +
    partialBottom(inv) +
    partialTerms(inv);

  return { css, body };
}

function templateModern(inv: InvoiceData): { css: string; body: string } {
  const a = inv.accent;
  const on = inv.on_accent;
  const tint = inv.accent_tint;
  const soft = inv.accent_soft;
  const s = inv.seller;

  const css = baseCss(inv) + `
.banner { background-color: ${a}; color: ${on}; border-radius: 3mm; padding: 6mm 7mm; }
.banner td { color: ${on}; vertical-align: middle; }
.banner .doc-title { color: ${on}; font-size: 24pt; }
.banner .doc-subtitle { color: ${on}; }
.banner .seller-name { font-size: 14pt; font-weight: bold; color: ${on}; }
.logo-box { background-color: #ffffff; border-radius: 2mm; padding: 2mm 3mm; }
.banner-right { text-align: right; width: 45%; }
.banner-meta { font-size: 8pt; color: ${on}; margin-top: 3pt; }
.cards { margin-top: 8mm; }
.cards td.party, .cards td.card { background-color: ${tint}; padding: 4mm; border-left: 1.4mm solid #ffffff; border-right: 1.4mm solid #ffffff; }
.cards td.first { border-left: 0; }
.cards td.last { border-right: 0; }
.cards .meta td { font-size: 7.8pt; }
.items th { color: ${a}; background-color: ${tint}; border-bottom: 1pt solid ${a}; }
.items tr.even td { background-color: #fafafa; }
.totals tr.grand td { background-color: ${a}; color: ${on}; font-size: 12pt; }
.totals tr.balance td { background-color: ${soft}; }`;

  const identity = inv.logo
    ? `<span class="logo-box">${partialLogo(inv)}</span>`
    : `<div class="seller-name">${e(s.name)}</div>`;

  const seller = `<td class="card first">` +
    partialParty(inv, 'From', s, inv.tax_id_label) + '</td>';
  const parties = partialPartiesCells(inv);
  const details = `<td class="card last" style="width: 30%;"><div class="party-title">Invoice Details</div>` +
    partialMeta(inv) + '</td>';

  const body = `<div class="banner"><table><tr><td>${identity}</td>` +
    `<td class="banner-right">${partialTitle(inv)}` +
    `<div class="banner-meta">No. ${e(inv.number)}  |  ${e(inv.date)}</div></td></tr></table></div>` +
    `<table class="cards"><tr>${seller}${parties}${details}</tr></table>` +
    partialItems(inv) +
    partialTaxSummary(inv) +
    partialBottom(inv) +
    partialTerms(inv);

  return { css, body };
}

function templateSidebar(inv: InvoiceData): { css: string; body: string } {
  const a = inv.accent;
  const on = inv.on_accent;
  const tint = inv.accent_tint;
  const s = inv.seller;

  const css = baseCss(inv) + `
.top td { vertical-align: top; }
.side { width: 36%; background-color: ${a}; color: ${on}; padding: 6mm 5mm; border-radius: 3mm; }
.side-name { font-size: 13pt; font-weight: bold; color: ${on}; padding: 3mm 0 2mm; }
.side-lines { font-size: 8pt; color: ${on}; }
.side-title { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8pt; color: ${on}; margin-bottom: 3pt; }
.side-label { color: ${on}; width: 32%; }
.side .bank td { color: ${on}; }
.logo-box { background-color: #ffffff; border-radius: 2mm; padding: 2mm 3mm; }
.main { padding-left: 7mm; }
.main .meta { margin-top: 5mm; }
.main .party { padding-top: 6mm; }
.items th { color: ${a}; border-bottom: 1.2pt solid ${a}; }
.items tr.even td { background-color: ${tint}; }
.totals tr.grand td { color: ${a}; border-top: 1.2pt solid ${a}; border-bottom: 1.2pt solid ${a}; font-size: 12pt; }
.totals tr.balance td { background-color: ${tint}; }`;

  const identity = (inv.logo ? `<span class="logo-box">${partialLogo(inv)}</span>` : '') +
    `<div class="side-name">${e(s.name)}</div>` +
    `<div class="side-lines">${partyLines(inv, s, inv.tax_id_label)}</div>` +
    partialPayment(inv, 'side-title', 'side-label');

  const parties = `<table><tr>${partialPartiesCells(inv)}</tr></table>`;

  const body = '<table class="top"><tr>' +
    `<td class="side">${identity}</td>` +
    `<td class="main">${partialTitle(inv)}${partialMeta(inv)}${parties}</td>` +
    '</tr></table>' +
    partialItems(inv) +
    partialTaxSummary(inv) +
    partialBottom(inv, false) +
    partialTerms(inv);

  return { css, body };
}

function templateMinimal(inv: InvoiceData): { css: string; body: string } {
  const a = inv.accent;
  const tint = inv.accent_tint;
  const s = inv.seller;
  const line = '0.6pt solid #374151';

  const css = baseCss(inv) + `
body { color: #111111; }
.frame { border-top: 2.4pt solid ${a}; }
.title-row td { text-align: center; padding: 4mm 0 3mm; border-bottom: ${line}; }
.doc-title { color: #111111; font-size: 16pt; letter-spacing: 3pt; }
.grid td { border-bottom: ${line}; padding: 3mm; width: 50%; }
.grid td.l { border-right: ${line}; }
.party-title, .block-title { color: ${a}; }
.seller-name { font-size: 11pt; font-weight: bold; margin: 2pt 0; }
.items { margin-top: 0; }
.items th { border: ${line}; background-color: ${tint}; color: #111111; }
.items td { border-left: ${line}; border-right: ${line}; border-bottom: 0.3pt solid #d1d5db; }
.items tbody tr:last-child td { border-bottom: ${line}; }
.tax-summary { width: 100%; margin-top: 0; }
.tax-summary th, .tax-summary td { border: ${line}; color: #111111; }
.bottom { margin-top: 0; }
.bottom-left, .bottom-right { border: ${line}; padding: 3mm; }
.totals td { border-bottom: 0.3pt solid #d1d5db; }
.totals tr.grand td { border-top: ${line}; border-bottom: 1.6pt double #111111; }
.terms { border: ${line}; border-top: 0; padding: 0 3mm 3mm; margin-top: 0; }`;

  const sellerCell = `<td class="l">${partialLogo(inv)}` +
    `<div class="party-title">Supplier</div><div class="seller-name">${e(s.name)}</div>` +
    `<div class="party-lines">${partyLines(inv, s, inv.tax_id_label)}</div></td>`;
  const metaCell = `<td><div class="party-title">Invoice Details</div>${partialMeta(inv)}</td>`;

  const buyerCell = `<td class="l">${partialParty(inv, 'Bill To', inv.buyer, inv.buyer_tax_id_label)}</td>`;
  const shipCell = inv.ship
    ? `<td>${partialParty(inv, 'Ship To', inv.ship, inv.buyer_tax_id_label)}</td>`
    : '<td><div class="party-title">Ship To</div><div class="party-lines">Same as billing address</div></td>';

  const body = `<div class="frame"><table><tr class="title-row"><td>${partialTitle(inv)}</td></tr></table>` +
    `<table class="grid"><tr>${sellerCell}${metaCell}</tr><tr>${buyerCell}${shipCell}</tr></table>` +
    '</div>' +
    partialItems(inv) +
    partialTaxSummary(inv) +
    partialBottom(inv) +
    partialTerms(inv);

  return { css, body };
}

export function renderInvoice(inv: InvoiceData): { css: string; body: string } {
  switch (inv.template) {
    case 'modern':
      return templateModern(inv);
    case 'sidebar':
      return templateSidebar(inv);
    case 'minimal':
      return templateMinimal(inv);
    case 'classic':
    default:
      return templateClassic(inv);
  }
}

const PAGE_MARGIN_MM = { top: 14, right: 14, bottom: 18, left: 14 };

export function invoicePreviewHtml(inv: InvoiceData): string {
  const rendered = renderInvoice(inv);
  const m = PAGE_MARGIN_MM;
  
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>` +
    rendered.css +
    `html { background: transparent; } body { margin: 0; }` +
    `.sheet { width: 210mm; min-height: 297mm; box-sizing: border-box; background: #fff;` +
    ` padding: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; position: relative; }` +
    `.sheet-footer { position: absolute; left: ${m.left}mm; right: ${m.right}mm; bottom: 7mm;` +
    ` font-size: 7pt; color: #6b7280; }` +
    `</style></head><body><div class="sheet">` +
    rendered.body +
    `<div class="sheet-footer">${pageFooterText(inv)}</div>` +
    `</div></body></html>`;
}

export function invoiceFilename(inv: InvoiceData): string {
  const safe = inv.number.replace(/[^A-Za-z0-9_\-]+/g, '_') || 'draft';
  return `Invoice_${safe}.pdf`;
}
