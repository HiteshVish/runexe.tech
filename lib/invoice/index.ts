/**
 * RunExe Invoice Generator - TypeScript/Next.js Port
 * 
 * Main exports for the invoice generation library.
 */

// Core invoice building
export { buildInvoice, TEMPLATES } from './invoice-build';
export type {
  InvoiceData,
  InvoiceBuildResult,
  InvoiceIssue,
  InvoiceIssueSection,
  Party,
  InvoiceItem,
  TaxLine,
  TaxSummary,
  TemplateType,
} from './invoice-build';

// Rendering
export { renderInvoice, invoicePreviewHtml, invoiceFilename } from './render-invoice';

// Regional data and validation
export {
  INDIA_STATES,
  CURRENCIES,
  INVOICE_MODES,
  PLACE_OF_SUPPLY_EXPORT,
  UTGST_STATE_CODES,
  gstinNormalize,
  gstinError,
  gstinStateCode,
  gstinPan,
  stateLabel,
  stateCodeFromName,
  currencyInfo,
} from './regions';
export type { CurrencyInfo, InvoiceModeInfo } from './regions';

// Formatting utilities
export {
  formatNumber,
  formatMoney,
  formatQty,
  formatPct,
  amountInWords,
  hexTint,
  hexOnColor,
} from './format';

// Lookups
export { lookupIfsc, lookupPincode, lookupVat } from './lookup';
export type {
  LookupResult,
  IfscLookupResult,
  PincodeLookupResult,
  VatLookupResult,
  LookupErrorResult,
} from './lookup';

export { lookupGst } from './gst-lookup';
export type {
  GstLookupResult,
  GstLookupSuccess,
  GstLookupError,
  GstLookupData,
  GstAddress,
} from './gst-lookup';

// Form data parsing
export { parseFormData, parseInvoiceFormData, prepareInvoiceFiles } from './form-data';
export type { ParsedFormData, ParsedFiles } from './form-data';

// GeoIP
export { visitorCountry } from './geo';

// GST config
export { gstLookupConfig } from './gst-config';
export type { GstLookupConfig } from './gst-config';
