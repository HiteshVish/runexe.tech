/**
 * Turns submitted form data into a validated, fully calculated invoice object.
 * Preview and PDF both render from this.
 */

import {
  INVOICE_MODES,
  INDIA_STATES,
  CURRENCIES,
  gstinNormalize,
  gstinError,
  gstinStateCode,
  gstinPan,
  stateLabel,
  PLACE_OF_SUPPLY_EXPORT,
  UTGST_STATE_CODES,
} from './regions';
import { amountInWords, hexTint, hexOnColor } from './format';

export const TEMPLATES = ['classic', 'modern', 'sidebar', 'minimal'] as const;
export type TemplateType = typeof TEMPLATES[number];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_QTY = 1e9;
const MAX_PRICE = 1e12;
const MAX_TOTAL = 1e13;

export interface Party {
  name: string;
  address: string;
  country: string;
  state: string;
  tax_id: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
  state_label?: string;
}

export interface InvoiceItem {
  n: number;
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  price: number;
  discount: number;
  gross: number;
  discount_amount: number;
  taxable: number;
  rate: number;
}

export interface TaxLine {
  label: string;
  amount: number;
}

export interface TaxSummary {
  rate: string;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
}

export interface InvoiceData {
  mode: string;
  india: boolean;
  taxed: boolean;
  title: string;
  subtitle: string;
  template: TemplateType;
  accent: string;
  accent_tint: string;
  accent_soft: string;
  on_accent: string;
  currency: string;
  number: string;
  date: string;
  due_date: string;
  terms_label: string;
  reference: string;
  reverse_charge: boolean;
  place_of_supply: string;
  is_inter: boolean;
  export_type: 'lut' | 'igst';
  lut_arn: string;
  tax_name: string;
  tax_id_label: string;
  buyer_tax_id_label: string;
  sgst_label: string;
  seller: Party;
  buyer: Party;
  ship: Party | null;
  items: InvoiceItem[];
  show_hsn: boolean;
  show_discount: boolean;
  show_tax_rate: boolean;
  subtotal: number;
  discount_total: number;
  taxable_total: number;
  tax_lines: TaxLine[];
  tax_summary: TaxSummary[];
  tax_total: number;
  other_charges: number;
  other_charges_label: string;
  round_off: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  amount_words: string;
  bank: Record<string, string>;
  notes: string;
  terms: string;
  declaration: string[];
  logo: string | null;
  signature: string | null;
}

export type InvoiceIssueSection = 'invoice' | 'seller' | 'buyer' | 'items' | 'tax' | 'files';

export interface InvoiceIssue {
  message: string;
  section: InvoiceIssueSection;
  field?: string;
  row?: number;
}

export interface InvoiceBuildResult {
  data: InvoiceData;
  errors: string[];
  issues: InvoiceIssue[];
}

interface PostData {
  [key: string]: any;
}

interface FileData {
  data?: string | ArrayBuffer | null;
  size?: number;
  type?: string;
}

interface FilesData {
  [key: string]: FileData | undefined;
}

class InvoiceBuilder {
  private errors: string[] = [];
  private issues: InvoiceIssue[] = [];
  private post: PostData;

  constructor(post: PostData) {
    this.post = post;
  }

  private issue(issue: InvoiceIssue): void {
    this.issues.push(issue);
    this.errors.push(issue.message);
  }

  validationIssues(): InvoiceIssue[] {
    return this.issues;
  }

  validationErrors(): string[] {
    return this.errors;
  }

  private str(key: string, defaultValue = '', source?: PostData | null, max = 500): string {
    const src = source ?? this.post;
    let value = src[key] ?? defaultValue;
    
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      return defaultValue;
    }
    
    value = String(value).trim().replace(/\r/g, '');
    return value.slice(0, max);
  }

  private num(key: string, defaultValue = 0, source?: PostData | null): number {
    const src = source ?? this.post;
    let value = src[key];
    
    if (typeof value === 'string') {
      value = value.replace(/[,\s]/g, '');
    }
    
    if (typeof value !== 'number' && typeof value !== 'string') {
      return defaultValue;
    }
    
    const number = parseFloat(String(value));
    return Number.isFinite(number) ? number : defaultValue;
  }

  private party(key: string): Party {
    const src = (this.post[key] && typeof this.post[key] === 'object') ? this.post[key] : {};
    return {
      name: this.str('name', '', src, 200),
      address: this.str('address', '', src, 600),
      country: this.str('country', '', src, 80),
      state: this.str('state', '', src, 2),
      tax_id: this.str('tax_id', '', src, 40).toUpperCase(),
      pan: this.str('pan', '', src, 10).toUpperCase(),
      email: this.str('email', '', src, 150),
      phone: this.str('phone', '', src, 60),
      website: this.str('website', '', src, 150),
    };
  }

  /**
   * Accepts either a File object or a data URL string.
   * Images are kept in memory and embedded.
   */
  private image(files: FilesData, field: string, label: string): string | null {
    let bytes: ArrayBuffer | string | null = null;
    const file = files[field];
    
    if (file && file.data) {
      bytes = file.data;
    } else {
      const dataUrl = this.post[field + '_data'];
      if (typeof dataUrl !== 'string' || !dataUrl) {
        return null;
      }
      
      const comma = dataUrl.indexOf(',');
      const prefix = comma === -1 ? '' : dataUrl.slice(0, comma);
      
      if (!['data:image/png;base64', 'data:image/jpeg;base64'].includes(prefix)) {
        this.issue({
          message: `${label} must be a PNG or JPG image.`,
          section: 'files',
          field,
        });
        return null;
      }
      
      try {
        const base64 = dataUrl.slice(comma + 1);
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytesArray = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytesArray[i] = binaryString.charCodeAt(i);
        }
        bytes = bytesArray.buffer;
      } catch {
        this.issue({ message: `${label} could not be read.`, section: 'files', field });
        return null;
      }
    }
    
    if (!bytes) {
      this.issue({ message: `${label} could not be read.`, section: 'files', field });
      return null;
    }
    
    const size = bytes instanceof ArrayBuffer ? bytes.byteLength : bytes.length;
    if (size > MAX_IMAGE_BYTES) {
      this.issue({ message: `${label} must be 2 MB or smaller.`, section: 'files', field });
      return null;
    }
    
    // Return as data URL for embedding
    if (typeof bytes === 'string' && bytes.startsWith('data:')) {
      return bytes;
    }
    
    // For ArrayBuffer, we'd need to validate image format server-side
    // For now, assume it's valid if size is OK
    return this.post[field + '_data'] || null;
  }

  private static formatDate(ymd: string): string {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
    try {
      const date = new Date(ymd + 'T00:00:00Z');
      if (isNaN(date.getTime())) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const d = date.getUTCDate();
      const m = months[date.getUTCMonth()];
      const y = date.getUTCFullYear();
      return `${d.toString().padStart(2, '0')} ${m} ${y}`;
    } catch {
      return '';
    }
  }

  public assemble(files: FilesData): InvoiceData {
    const mode = this.str('mode', 'no_tax');
    const modeInfo = INVOICE_MODES[mode] || INVOICE_MODES['no_tax'];
    const india = modeInfo.india;
    const taxed = modeInfo.taxed;

    let template = this.str('template', 'classic') as TemplateType;
    if (!TEMPLATES.includes(template)) {
      template = 'classic';
    }

    let accent = this.str('accent', '#8B1A1A').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(accent)) {
      accent = '#8B1A1A';
    }

    let currency = this.str('currency', modeInfo.currency).toUpperCase();
    if (!CURRENCIES[currency]) {
      currency = modeInfo.currency;
    }

    const seller = this.party('seller');
    const buyer = this.party('buyer');
    let ship: Party | null = null;
    
    if (this.post['ship_enabled']) {
      const shipParty = this.party('ship');
      if (shipParty.name || shipParty.address) {
        ship = shipParty;
      }
    }

    // Invoice details
    const number = this.str('invoice_number', '', null, 40);
    const date = this.str('invoice_date', new Date().toISOString().split('T')[0], null, 10);
    let dueDate = this.str('due_date', '', null, 10);
    const termsDays = this.str('payment_terms', '', null, 10);
    
    if (!dueDate && /^\d+$/.test(termsDays) && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      try {
        const d = new Date(date + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + parseInt(termsDays, 10));
        dueDate = d.toISOString().split('T')[0];
      } catch {
        // Invalid date
      }
    }

    const termsLabel =
      termsDays === '0' ? 'Due on receipt'
      : ['7', '15', '30', '45', '60'].includes(termsDays) ? `Net ${termsDays} days`
      : '';

    if (!number) {
      this.issue({ message: 'Invoice number is required.', section: 'invoice', field: 'invoice_number' });
    } else if (india) {
      if (number.length > 16) {
        this.issue({
          message: 'Invoice number must be 16 characters or fewer for a GST invoice.',
          section: 'invoice',
          field: 'invoice_number',
        });
      } else if (!/^[A-Za-z0-9/\-]+$/.test(number)) {
        this.issue({
          message: 'Invoice number may only use letters, numbers, "-" and "/" for a GST invoice.',
          section: 'invoice',
          field: 'invoice_number',
        });
      }
    }

    if (!InvoiceBuilder.formatDate(date)) {
      this.issue({ message: 'Invoice date is invalid.', section: 'invoice', field: 'invoice_date' });
    }
    if (dueDate && !InvoiceBuilder.formatDate(dueDate)) {
      this.issue({ message: 'Due date is invalid.', section: 'invoice', field: 'due_date' });
    }
    if (!seller.name) {
      this.issue({ message: 'Your business name is required.', section: 'seller', field: 'seller_name' });
    }
    if (!buyer.name) {
      this.issue({ message: 'Client name is required.', section: 'buyer', field: 'buyer_name' });
    }

    for (const [who, p] of [['seller', seller], ['buyer', buyer]] as const) {
      if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
        this.issue({
          message: `${who === 'seller' ? 'Your' : 'Client'} email address is invalid.`,
          section: who === 'seller' ? 'seller' : 'buyer',
          field: who === 'seller' ? 'seller_email' : 'buyer_email',
        });
      }
    }

    // Tax regime
    let taxName = 'Tax';
    let taxIdLabel = this.str('tax_id_label', mode === 'no_tax' ? 'Business Registration No.' : 'VAT No.', null, 40);
    let buyerTaxIdLabel = taxIdLabel;
    let sellerStateCode: string | null = null;
    let buyerStateCode: string | null = null;
    let posCode: string | null = null;
    let isInter = false;
    const exportType = this.str('export_type', 'lut') === 'igst' ? 'igst' : 'lut';
    const lutArn = this.str('lut_arn', '', null, 40).toUpperCase();
    const reverseCharge = this.str('reverse_charge') === 'yes';
    let sgstLabel = 'SGST';

    if (mode === 'custom_tax') {
      taxName = this.str('tax_name', 'VAT', null, 20) || 'VAT';
    }

    if (india) {
      taxName = 'GST';
      taxIdLabel = 'GSTIN';
      seller.country = 'India';
      seller.tax_id = gstinNormalize(seller.tax_id);
      
      if (!seller.tax_id) {
        this.issue({
          message: 'Your GSTIN is required for a GST invoice.',
          section: 'tax',
          field: 'seller_tax_id',
        });
      } else {
        const err = gstinError(seller.tax_id);
        if (err) {
          this.issue({ message: `Your GSTIN ${err}.`, section: 'tax', field: 'seller_tax_id' });
        } else {
          sellerStateCode = gstinStateCode(seller.tax_id);
          if (!seller.pan) {
            seller.pan = gstinPan(seller.tax_id);
          }
        }
      }
      
      if (!sellerStateCode && INDIA_STATES[seller.state]) {
        sellerStateCode = seller.state;
      }
    }

    if (mode === 'in_gst') {
      buyerTaxIdLabel = 'GSTIN';
      buyer.country = buyer.country || 'India';
      buyer.tax_id = gstinNormalize(buyer.tax_id);
      
      if (buyer.tax_id) {
        const err = gstinError(buyer.tax_id);
        if (err) {
          this.issue({ message: `Client GSTIN ${err}.`, section: 'tax', field: 'buyer_tax_id' });
        } else {
          buyerStateCode = gstinStateCode(buyer.tax_id);
          if (!buyer.pan) {
            buyer.pan = gstinPan(buyer.tax_id);
          }
        }
      }
      
      if (!buyerStateCode && INDIA_STATES[buyer.state]) {
        buyerStateCode = buyer.state;
      }
      
      posCode = this.str('place_of_supply', '', null, 2);
      if (!INDIA_STATES[posCode]) {
        posCode = buyerStateCode;
      }
      if (!posCode) {
        this.issue({
          message: "Place of supply is required. Choose the client's state or enter their GSTIN.",
          section: 'tax',
          field: 'place_of_supply',
        });
      }
      if (sellerStateCode && posCode) {
        isInter = sellerStateCode !== posCode;
      }
      if (UTGST_STATE_CODES.includes(sellerStateCode || '')) {
        sgstLabel = 'UTGST';
      }
    } else if (mode === 'in_export') {
      buyerTaxIdLabel = 'Tax ID';
      posCode = PLACE_OF_SUPPLY_EXPORT;
      isInter = true;
      if (!buyer.country || buyer.country.toLowerCase() === 'india') {
        this.issue({
          message: 'Client country is required for an export invoice and must be outside India.',
          section: 'buyer',
          field: 'buyer_country',
        });
      }
      if (exportType === 'lut' && !lutArn) {
        this.issue({
          message: 'LUT reference (ARN) is required when exporting without paying IGST.',
          section: 'tax',
          field: 'lut_arn',
        });
      }
    }

    // Line items
    const items: InvoiceItem[] = [];
    const rawItems = Array.isArray(this.post.items) ? this.post.items : [];
    let row = 0;

    for (const raw of rawItems) {
      if (!raw || typeof raw !== 'object') continue;

      const desc = this.str('description', '', raw, 1000);
      const hsn = this.str('hsn', '', raw, 12);
      const qty = this.num('qty', 0, raw);
      const price = this.num('price', 0, raw);

      if (!desc && !hsn && price === 0) continue;

      row++;
      const discount = Math.max(0, Math.min(100, this.num('discount', 0, raw)));
      let rate = taxed ? Math.max(0, Math.min(100, this.num('tax_rate', 0, raw))) : 0;

      if (mode === 'in_export' && exportType === 'lut') {
        rate = 0;
      }

      if (!desc) {
        this.issue({
          message: `Item ${row}: description is required.`,
          section: 'items',
          field: 'description',
          row,
        });
      }
      if (qty <= 0) {
        this.issue({
          message: `Item ${row}: quantity must be greater than 0.`,
          section: 'items',
          field: 'qty',
          row,
        });
      } else if (qty > MAX_QTY) {
        this.issue({
          message: `Item ${row}: quantity is too large.`,
          section: 'items',
          field: 'qty',
          row,
        });
      }
      if (price < 0) {
        this.issue({
          message: `Item ${row}: unit price cannot be negative.`,
          section: 'items',
          field: 'price',
          row,
        });
      } else if (price > MAX_PRICE) {
        this.issue({
          message: `Item ${row}: unit price is too large.`,
          section: 'items',
          field: 'price',
          row,
        });
      }
      if (india && !hsn) {
        this.issue({
          message: `Item ${row}: HSN/SAC code is required for a GST invoice.`,
          section: 'items',
          field: 'hsn',
          row,
        });
      } else if (hsn && !/^\d+$/.test(hsn)) {
        this.issue({
          message: `Item ${row}: HSN/SAC code must contain digits only.`,
          section: 'items',
          field: 'hsn',
          row,
        });
      }

      const gross = Math.round(qty * price * 100) / 100;
      const discountAmount = Math.round(gross * discount) / 100;
      
      items.push({
        n: row,
        description: desc,
        hsn,
        qty,
        unit: this.str('unit', '', raw, 12),
        price,
        discount,
        gross,
        discount_amount: discountAmount,
        taxable: Math.round((gross - discountAmount) * 100) / 100,
        rate,
      });
    }

    if (items.length === 0) {
      this.issue({ message: 'Add at least one line item.', section: 'items', field: 'description' });
    }

    // Totals
    const subtotal = Math.round(items.reduce((sum, it) => sum + it.gross, 0) * 100) / 100;
    const discountTotal = Math.round(items.reduce((sum, it) => sum + it.discount_amount, 0) * 100) / 100;
    const taxableTotal = Math.round(items.reduce((sum, it) => sum + it.taxable, 0) * 100) / 100;

    const groups: Record<string, number> = {};
    for (const it of items) {
      const key = it.rate.toFixed(2).replace(/\.?0+$/, '');
      groups[key] = (groups[key] || 0) + it.taxable;
    }

    const taxLines: TaxLine[] = [];
    const taxSummary: TaxSummary[] = [];
    let taxTotal = 0;

    if (mode === 'in_export' && exportType === 'lut') {
      taxLines.push({ label: 'IGST @ 0% (export under LUT)', amount: 0 });
    } else if (taxed) {
      const sortedRates = Object.keys(groups).sort((a, b) => parseFloat(a) - parseFloat(b));
      
      for (const rate of sortedRates) {
        const rateF = parseFloat(rate);
        const base = Math.round(groups[rate] * 100) / 100;

        if (rateF === 0) {
          if (india) {
            taxSummary.push({ rate, taxable: base, cgst: 0, sgst: 0, igst: 0, tax: 0 });
          }
          continue;
        }

        if (india) {
          let cgst = 0, sgst = 0, igst = 0;
          
          if (isInter) {
            igst = Math.round(base * rateF) / 100;
            taxLines.push({ label: `IGST @ ${rate}%`, amount: igst });
          } else {
            const half = rateF / 2;
            const halfLabel = half.toFixed(2).replace(/\.?0+$/, '');
            cgst = Math.round(base * half) / 100;
            sgst = cgst;
            taxLines.push({ label: `CGST @ ${halfLabel}%`, amount: cgst });
            taxLines.push({ label: `${sgstLabel} @ ${halfLabel}%`, amount: sgst });
          }
          
          taxSummary.push({
            rate,
            taxable: base,
            cgst,
            sgst,
            igst,
            tax: Math.round((cgst + sgst + igst) * 100) / 100,
          });
          taxTotal += cgst + sgst + igst;
        } else {
          const tax = Math.round(base * rateF) / 100;
          taxLines.push({ label: `${taxName} @ ${rate}%`, amount: tax });
          taxTotal += tax;
        }
      }
    }

    taxTotal = Math.round(taxTotal * 100) / 100;

    const otherCharges = Math.round(Math.max(0, this.num('other_charges')) * 100) / 100;
    const otherLabel = this.str('other_charges_label', '', null, 60) || 'Other charges';
    const beforeRound = Math.round((taxableTotal + taxTotal + otherCharges) * 100) / 100;
    const roundOff = this.post['round_off'] ? Math.round((Math.round(beforeRound) - beforeRound) * 100) / 100 : 0;
    const grandTotal = Math.round((beforeRound + roundOff) * 100) / 100;
    const amountPaid = Math.round(Math.max(0, this.num('amount_paid')) * 100) / 100;
    const balanceDue = Math.round((grandTotal - amountPaid) * 100) / 100;

    if (!Number.isFinite(grandTotal) || grandTotal > MAX_TOTAL || amountPaid > MAX_TOTAL) {
      this.issue({ message: 'The invoice total is too large.', section: 'invoice', field: 'other_charges' });
    }

    // Payment details
    const bankSrc = (this.post.bank && typeof this.post.bank === 'object') ? this.post.bank : {};
    const bankFields = {
      account_name: 'Account name',
      bank_name: 'Bank',
      account_number: 'Account no.',
      ifsc: 'IFSC',
      bank_code: 'Bank code',
      branch_code: 'Branch code',
      swift: 'SWIFT / BIC',
      iban: 'IBAN',
      fps_id: 'FPS ID',
      upi: 'UPI ID',
    };

    const bank: Record<string, string> = {};
    for (const [key, label] of Object.entries(bankFields)) {
      const value = this.str(key, '', bankSrc, 80);
      if (value) {
        bank[label] = value;
      }
    }

    // Declarations
    const declaration: string[] = [];
    let subtitle = '';
    
    if (mode === 'in_export') {
      subtitle = 'Export of goods / services';
      declaration.push(
        exportType === 'lut'
          ? `Supply meant for export under LUT without payment of IGST${lutArn ? ` (LUT ARN: ${lutArn})` : ''}.`
          : 'Supply meant for export on payment of IGST.'
      );
    }
    
    if (india) {
      declaration.push(
        'We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct.'
      );
    }

    seller.state_label = india ? stateLabel(sellerStateCode) : '';
    buyer.state_label = mode === 'in_gst' ? stateLabel(buyerStateCode) : '';
    if (ship) {
      ship.state_label = mode === 'in_gst' && INDIA_STATES[ship.state] ? stateLabel(ship.state) : '';
    }

    const anyDiscount = discountTotal > 0;

    return {
      mode,
      india,
      taxed,
      title: modeInfo.title,
      subtitle,
      template,
      accent,
      accent_tint: hexTint(accent, 0.92),
      accent_soft: hexTint(accent, 0.75),
      on_accent: hexOnColor(accent),
      currency,
      number,
      date: InvoiceBuilder.formatDate(date),
      due_date: InvoiceBuilder.formatDate(dueDate),
      terms_label: termsLabel,
      reference: this.str('reference', '', null, 60),
      reverse_charge: reverseCharge,
      place_of_supply: stateLabel(posCode),
      is_inter: isInter,
      export_type: exportType,
      lut_arn: lutArn,
      tax_name: taxName,
      tax_id_label: taxIdLabel,
      buyer_tax_id_label: buyerTaxIdLabel,
      sgst_label: sgstLabel,
      seller,
      buyer,
      ship,
      items,
      show_hsn: india || items.some(it => it.hsn),
      show_discount: anyDiscount,
      show_tax_rate: taxed,
      subtotal,
      discount_total: discountTotal,
      taxable_total: taxableTotal,
      tax_lines: taxLines,
      tax_summary: taxSummary,
      tax_total: taxTotal,
      other_charges: otherCharges,
      other_charges_label: otherLabel,
      round_off: roundOff,
      grand_total: grandTotal,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      amount_words: amountInWords(grandTotal, currency),
      bank,
      notes: this.str('notes', '', null, 1500),
      terms: this.str('terms', '', null, 2000),
      declaration,
      logo: this.image(files, 'logo', 'Logo'),
      signature: this.image(files, 'signature', 'Signature / company chop'),
    };
  }
}

export function buildInvoice(post: PostData, files: FilesData = {}): InvoiceBuildResult {
  const builder = new InvoiceBuilder(post);
  const data = builder.assemble(files);
  return { data, errors: builder.validationErrors(), issues: builder.validationIssues() };
}
