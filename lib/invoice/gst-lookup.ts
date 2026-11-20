/**
 * GST lookup implementation using the configured provider.
 * Includes caching, rate limiting, and address formatting.
 */

import { gstLookupConfig } from './gst-config';
import { gstinError, gstinNormalize, gstinStateCode, gstinPan, INDIA_STATES } from './regions';

export interface GstAddress {
  label: string;
  address: string;
  short: string;
}

export interface GstLookupData {
  gstin: string;
  legal_name: string;
  trade_name: string;
  name: string;
  address: string;
  addresses: GstAddress[];
  state_code: string | null;
  state: string;
  pan: string;
  status: string;
  type: string;
  constitution: string;
  registration_date: string;
  cancellation_date: string;
}

export interface GstLookupSuccess {
  ok: true;
  cached: boolean;
  data: GstLookupData;
}

export interface GstLookupError {
  ok: false;
  message: string;
}

export type GstLookupResult = GstLookupSuccess | GstLookupError;

function dotGet(data: any, path: string): any {
  if (!path) return null;
  const keys = path.split('.');
  let current = data;
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return null;
    }
    current = current[key];
  }
  return current;
}

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

function joinUnique(parts: string[], seen: Set<string>, glue = ', '): string {
  const out: string[] = [];
  for (let part of parts) {
    part = cleanText(part).replace(/[,.\s]+$/, '');
    const key = part.toLowerCase();
    if (!part || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out.join(glue);
}

function formatGstAddress(addr: unknown): { address: string; short: string } {
  if (typeof addr === 'string') {
    const text = cleanText(addr).replace(/\s*,\s*/g, ', ').replace(/^,+|,+$/g, '');
    return { address: text, short: text };
  }

  if (!addr || typeof addr !== 'object') {
    return { address: '', short: '' };
  }

  const a = addr as Record<string, any>;
  const f = (...keys: string[]): string => {
    for (const key of keys) {
      const value = cleanText(a[key]);
      if (value) return value;
    }
    return '';
  };

  const door = f('door_num', 'bno');
  const floor = f('floor_num', 'flno');
  const building = f('building_name', 'bnm');
  const street = f('street', 'st');
  const location = f('location', 'loc');
  const city = f('city');
  const district = f('district', 'dst');
  const state = f('state', 'stcd');
  const pin = f('pin_code', 'pncd');

  const seen = new Set<string>();
  const lines = [
    joinUnique([door, floor, building], seen),
    joinUnique([street, location, city], seen),
    (joinUnique([district, state], seen) + (pin ? ' - ' + pin : '')).replace(/^[\s-]+|[\s-]+$/g, ''),
  ].filter(Boolean);

  const shortSeen = new Set<string>();
  const short = (
    joinUnique([location || city, district], shortSeen) + (pin ? ' - ' + pin : '')
  ).replace(/^[\s-]+|[\s-]+$/g, '');

  return { address: lines.join('\n'), short };
}

/**
 * Lookup GST information from the configured provider.
 * Note: This is a server-side only function. In Next.js, call this from an API route.
 * Client-side rate limiting and caching would need to be implemented separately.
 */
export async function lookupGst(gstin: string): Promise<GstLookupResult> {
  const cfg = gstLookupConfig();

  if (!cfg.enabled) {
    return {
      ok: false,
      message: 'GST lookup is not set up yet. Please enter the details manually.',
    };
  }

  const normalized = gstinNormalize(gstin);
  const error = gstinError(normalized);

  if (error) {
    return { ok: false, message: `This GSTIN ${error}.` };
  }

  // Build request URL
  let url = cfg.endpoint.replace('{gstin}', encodeURIComponent(normalized));
  if (cfg.auth_query && cfg.api_key) {
    url += (url.includes('?') ? '&' : '?') + `${cfg.auth_query}=${encodeURIComponent(cfg.api_key)}`;
  }

  // Build headers
  const headers: Record<string, string> = { Accept: 'application/json' };
  for (const header of cfg.extra_headers) {
    const [key, value] = header.split(':').map(s => s.trim());
    if (key && value) {
      headers[key] = value;
    }
  }
  if (cfg.auth_header && cfg.api_key) {
    headers[cfg.auth_header] = cfg.auth_prefix + cfg.api_key;
  }

  // Make request
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), cfg.timeout * 1000);

    const response = await fetch(url, {
      method: cfg.method,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      return {
        ok: false,
        message: 'The GST lookup limit has been reached for now. Please enter the details manually.',
      };
    }

    if (response.status >= 500 || response.status === 401 || response.status === 403) {
      return {
        ok: false,
        message: 'The GST lookup service is not responding. Please try again later.',
      };
    }

    const json = await response.json();
    const map = cfg.map;
    const legal = cleanText(dotGet(json, map.legal_name));
    const successFlag = map.success ? dotGet(json, map.success) : true;

    if (response.status >= 400 || !successFlag || !legal) {
      return { ok: false, message: 'No business was found for this GSTIN.' };
    }

    // Parse addresses
    const addresses: GstAddress[] = [];
    const principal = formatGstAddress(dotGet(json, map.address));
    if (principal.address) {
      addresses.push({ label: 'Principal place of business', ...principal });
    }

    const additional = dotGet(json, map.additional_addresses);
    if (Array.isArray(additional)) {
      for (const item of additional) {
        const formatted = formatGstAddress(
          map.additional_address_field ? dotGet(item, map.additional_address_field) : item
        );
        if (formatted.address && !addresses.some(a => a.address === formatted.address)) {
          addresses.push({ label: 'Additional place of business', ...formatted });
        }
      }
    }

    const stateCode = gstinStateCode(normalized);
    const data: GstLookupData = {
      gstin: normalized,
      legal_name: legal,
      trade_name: cleanText(dotGet(json, map.trade_name)),
      name: legal,
      address: addresses[0]?.address || '',
      addresses,
      state_code: stateCode,
      state: stateCode ? INDIA_STATES[stateCode] : '',
      pan: gstinPan(normalized),
      status: cleanText(dotGet(json, map.status)),
      type: cleanText(dotGet(json, map.type)),
      constitution: cleanText(dotGet(json, map.constitution)),
      registration_date: cleanText(dotGet(json, map.registration_date)),
      cancellation_date: cleanText(dotGet(json, map.cancellation_date)),
    };

    return { ok: true, cached: false, data };
  } catch (error) {
    return {
      ok: false,
      message: 'The GST lookup service is not responding. Please try again later.',
    };
  }
}
