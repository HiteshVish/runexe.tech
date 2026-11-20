/**
 * Consolidated TypeScript type definitions for the invoice generator.
 * Re-exported from individual modules for convenience.
 */

// Re-export all types from modules
export type {
  InvoiceData,
  InvoiceBuildResult,
  Party,
  InvoiceItem,
  TaxLine,
  TaxSummary,
  TemplateType,
} from './invoice-build';

export type {
  CurrencyInfo,
  InvoiceModeInfo,
} from './regions';

export type {
  LookupResult,
  IfscLookupResult,
  PincodeLookupResult,
  VatLookupResult,
  LookupErrorResult,
} from './lookup';

export type {
  GstLookupResult,
  GstLookupSuccess,
  GstLookupError,
  GstLookupData,
  GstAddress,
} from './gst-lookup';

export type {
  ParsedFormData,
  ParsedFiles,
} from './form-data';

export type {
  GstLookupConfig,
} from './gst-config';
