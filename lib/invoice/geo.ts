/**
 * GeoIP lookup using mmdb-lib for visitor country detection.
 * Gracefully returns null if the database is missing.
 */

import { Reader } from 'mmdb-lib';
import path from 'path';
import { readFileSync } from 'fs';

const GEOIP_DB_PATH = path.join(process.cwd(), 'lib/invoice/data/dbip-country-lite.mmdb');

let reader: Reader<any> | null = null;
let readerInitialized = false;

function getReader(): Reader<any> | null {
  if (readerInitialized) {
    return reader;
  }

  try {
    const buffer = readFileSync(GEOIP_DB_PATH);
    reader = new Reader<any>(buffer);
    readerInitialized = true;
  } catch {
    // Database file missing or unreadable - gracefully degrade
    reader = null;
    readerInitialized = true;
  }

  return reader;
}

/**
 * Two-letter country code of the visitor, or null when unknown.
 * In a Next.js API route, you can override with ?country=XX query param.
 */
export function visitorCountry(ip?: string | null): string | null {
  if (!ip) {
    return null;
  }

  // Skip private/reserved IPs
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  ) {
    return null;
  }

  const db = getReader();
  if (!db) {
    return null;
  }

  try {
    const record = db.get(ip);
    const code = record?.country?.iso_code;
    if (typeof code === 'string' && /^[A-Z]{2}$/.test(code.toUpperCase())) {
      return code.toUpperCase();
    }
  } catch {
    // Invalid IP or lookup error
    return null;
  }

  return null;
}
