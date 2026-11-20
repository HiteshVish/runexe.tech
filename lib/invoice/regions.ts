/**
 * Reference data and helpers: Indian GST state codes, GSTIN validation,
 * currencies, money formatting and amount-in-words.
 */

export const INDIA_STATES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

export const PLACE_OF_SUPPLY_EXPORT = '96';

/** Union territories without a legislature charge UTGST instead of SGST. */
export const UTGST_STATE_CODES = ['04', '26', '31', '35', '38', '97'];

export interface CurrencyInfo {
  symbol: string;
  name: string;
  minor: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollars', minor: 'Cents' },
  USD: { symbol: 'US$', name: 'US Dollars', minor: 'Cents' },
  INR: { symbol: '₹', name: 'Rupees', minor: 'Paise' },
  EUR: { symbol: '€', name: 'Euros', minor: 'Cents' },
  GBP: { symbol: '£', name: 'Pounds Sterling', minor: 'Pence' },
  SGD: { symbol: 'S$', name: 'Singapore Dollars', minor: 'Cents' },
  AED: { symbol: 'AED ', name: 'UAE Dirhams', minor: 'Fils' },
  CNY: { symbol: 'CN¥', name: 'Chinese Yuan', minor: 'Fen' },
  AUD: { symbol: 'A$', name: 'Australian Dollars', minor: 'Cents' },
  CAD: { symbol: 'C$', name: 'Canadian Dollars', minor: 'Cents' },
};

export interface InvoiceModeInfo {
  title: string;
  india: boolean;
  taxed: boolean;
  currency: string;
}

export const INVOICE_MODES: Record<string, InvoiceModeInfo> = {
  no_tax: { title: 'Invoice', india: false, taxed: false, currency: 'HKD' },
  in_gst: { title: 'Tax Invoice', india: true, taxed: true, currency: 'INR' },
  in_export: { title: 'Tax Invoice', india: true, taxed: true, currency: 'USD' },
  custom_tax: { title: 'Tax Invoice', india: false, taxed: true, currency: 'USD' },
};

const GSTIN_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function gstinNormalize(gstin: string): string {
  return gstin.toUpperCase().replace(/\s+/g, '');
}

function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = GSTIN_CHARSET.indexOf(first14[i]) * ((i % 2) + 1);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARSET[(36 - (sum % 36)) % 36];
}

/** Returns null when valid, otherwise a human-readable reason. */
export function gstinError(gstin: string): string | null {
  gstin = gstinNormalize(gstin);
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    return 'must be 15 characters in the format 27AAAAA0000A1Z5';
  }
  if (!INDIA_STATES[gstin.slice(0, 2)]) {
    return 'starts with an unknown state code ' + gstin.slice(0, 2);
  }
  if (gstinCheckChar(gstin.slice(0, 14)) !== gstin[14]) {
    return 'has an invalid check digit (last character) - please re-check for typos';
  }
  return null;
}

export function gstinStateCode(gstin: string): string | null {
  const code = gstinNormalize(gstin).slice(0, 2);
  return INDIA_STATES[code] ? code : null;
}

export function gstinPan(gstin: string): string {
  return gstinNormalize(gstin).slice(2, 12);
}

export function stateLabel(code: string | null): string {
  if (code === PLACE_OF_SUPPLY_EXPORT) {
    return '96 - Other Countries';
  }
  return code && INDIA_STATES[code] ? `${code} - ${INDIA_STATES[code]}` : '';
}

/** Matches a state name as written by India Post / banks (any case, "&" or "and", old names). */
export function stateCodeFromName(name: string): string | null {
  const key = (s: string): string =>
    s
      .toLowerCase()
      .replace('&', 'and')
      .replace(/[^a-z]/g, '');

  const aliases: Record<string, string> = {
    orissa: '21',
    pondicherry: '34',
    uttaranchal: '05',
    dadraandnagarhaveli: '26',
    damananddiu: '26',
    andamanandnicobar: '35',
    jammukashmir: '01',
  };

  const wanted = key(name);
  if (aliases[wanted]) {
    return aliases[wanted];
  }

  for (const [code, state] of Object.entries(INDIA_STATES)) {
    if (key(state) === wanted) {
      return code;
    }
  }
  return null;
}

export function currencyInfo(code: string): CurrencyInfo {
  return CURRENCIES[code] ?? CURRENCIES['USD'];
}
