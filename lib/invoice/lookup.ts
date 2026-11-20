/**
 * Free, keyless lookups for IFSC, PIN code, and EU VAT validation.
 * These are used to prefill the invoice form.
 */

import { stateCodeFromName } from './regions';

export interface IfscLookupResult {
  ok: true;
  data: {
    ifsc: string;
    bank: string;
    branch: string;
    city: string;
    district: string;
    state: string;
    swift: string;
  };
}

export interface PincodeLookupResult {
  ok: true;
  data: {
    pin: string;
    district: string;
    state: string;
    state_code: string | null;
    offices: string[];
  };
}

export interface VatLookupResult {
  ok: true;
  data: {
    number: string;
    valid: boolean;
    name: string;
    address: string;
  };
}

export interface LookupErrorResult {
  ok: false;
  message: string;
}

export type LookupResult =
  | IfscLookupResult
  | PincodeLookupResult
  | VatLookupResult
  | LookupErrorResult;

const EU_VAT_COUNTRIES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU',
  'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI',
];

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanVies(value: unknown): string {
  if (typeof value !== 'string') return '';
  const cleaned = value.split('||')[0].trim().replace(/ {2,}/g, ', ');
  return cleaned === '---' ? '' : cleaned;
}

async function httpGetJson(url: string, timeout = 10000): Promise<[number, any]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json();
    return [response.status, json];
  } catch (error) {
    return [0, null];
  }
}

export async function lookupIfsc(ifsc: string): Promise<LookupResult> {
  const normalized = ifsc.toUpperCase().replace(/[\s.\-]/g, '');

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalized)) {
    return { ok: false, message: 'Invalid IFSC code format.' };
  }

  const [status, json] = await httpGetJson(
    `https://ifsc.razorpay.com/${encodeURIComponent(normalized)}`
  );

  if (status === 200 && json?.BANK) {
    return {
      ok: true,
      data: {
        ifsc: normalized,
        bank: String(json.BANK || '').trim(),
        branch: titleCase(String(json.BRANCH || '')),
        city: titleCase(String(json.CITY || '')),
        district: titleCase(String(json.DISTRICT || '')),
        state: titleCase(String(json.STATE || '')),
        swift: String(json.SWIFT || '').trim(),
      },
    };
  }

  if (status === 404) {
    return { ok: false, message: 'No bank branch was found for this IFSC.' };
  }

  return { ok: false, message: 'The lookup service is not responding right now.' };
}

export async function lookupPincode(pincode: string): Promise<LookupResult> {
  const normalized = pincode.replace(/[\s.\-]/g, '');

  if (!/^[1-9][0-9]{5}$/.test(normalized)) {
    return { ok: false, message: 'Invalid PIN code format.' };
  }

  const [status, json] = await httpGetJson(
    `https://api.postalpincode.in/pincode/${normalized}`
  );

  if (status === 200 && Array.isArray(json) && json[0]) {
    const entry = json[0];
    const offices = Array.isArray(entry.PostOffice) ? entry.PostOffice : [];

    if (entry.Status === 'Success' && offices.length > 0) {
      const first = offices[0];
      return {
        ok: true,
        data: {
          pin: normalized,
          district: String(first.District || '').trim(),
          state: String(first.State || '').trim(),
          state_code: stateCodeFromName(String(first.State || '')),
          offices: Array.from(
            new Set(offices.map((o: { Name?: string }) => String(o.Name || '').trim())),
          ).slice(0, 12) as string[],
        },
      };
    }

    return { ok: false, message: 'This PIN code was not found.' };
  }

  return { ok: false, message: 'The lookup service is not responding right now.' };
}

export async function lookupVat(vat: string): Promise<LookupResult> {
  let normalized = vat.toUpperCase().replace(/[\s.\-]/g, '');

  if (!/^[A-Z]{2}[A-Z0-9]{2,13}$/.test(normalized)) {
    return { ok: false, message: 'Invalid VAT number format.' };
  }

  // Greece uses EL in VIES but GR in ISO
  normalized = normalized.replace(/^GR/, 'EL');

  const country = normalized.slice(0, 2);
  const number = normalized.slice(2);

  if (!EU_VAT_COUNTRIES.includes(country)) {
    return { ok: false, message: 'VAT number country code is not in the EU.' };
  }

  const [status, json] = await httpGetJson(
    `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${country}/vat/${encodeURIComponent(number)}`,
    15000
  );

  const userError = json?.userError;

  if (status === 200 && (userError === 'VALID' || userError === 'INVALID')) {
    return {
      ok: true,
      data: {
        number: country + number,
        valid: userError === 'VALID',
        name: cleanVies(json.name),
        address: cleanVies(json.address),
      },
    };
  }

  if (status === 200 && userError === 'INVALID_INPUT') {
    return {
      ok: true,
      data: {
        number: country + number,
        valid: false,
        name: '',
        address: '',
      },
    };
  }

  return { ok: false, message: 'The lookup service is not responding right now.' };
}
