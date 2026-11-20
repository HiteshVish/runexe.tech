/**
 * Money formatting and number-to-words conversion utilities.
 */

import { currencyInfo } from './regions';

/** Indian grouping (12,34,567.89) for INR, international grouping otherwise. */
export function formatNumber(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) {
    return '-';
  }
  const negative = amount < 0;
  const abs = Math.abs(amount);

  if (currency === 'INR') {
    const [whole, fraction] = abs.toFixed(2).split('.');
    let formattedWhole = whole;
    if (whole.length > 3) {
      const last3 = whole.slice(-3);
      const rest = whole.slice(0, -3);
      const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      formattedWhole = restFormatted + ',' + last3;
    }
    return (negative ? '-' : '') + formattedWhole + '.' + fraction;
  }

  const formatted = abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '-' : '') + formatted;
}

export function formatMoney(amount: number, currency: string): string {
  const symbol = currencyInfo(currency).symbol;
  const negative = amount < 0;
  return (negative ? '-' : '') + symbol + formatNumber(Math.abs(amount), currency);
}

function wordsBelowThousand(n: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const parts: string[] = [];
  if (n >= 100) {
    parts.push(ones[Math.floor(n / 100)] + ' Hundred');
    n %= 100;
  }
  if (n >= 20) {
    const tensDigit = Math.floor(n / 10);
    const onesDigit = n % 10;
    parts.push(tens[tensDigit] + (onesDigit ? ' ' + ones[onesDigit] : ''));
  } else if (n > 0) {
    parts.push(ones[n]);
  }
  return parts.join(' ');
}

function integerToWords(n: number, indian: boolean): string {
  if (n === 0) {
    return 'Zero';
  }

  const scales = indian
    ? [
        [10000000, 'Crore'],
        [100000, 'Lakh'],
        [1000, 'Thousand'],
      ]
    : [
        [1000000000000, 'Trillion'],
        [1000000000, 'Billion'],
        [1000000, 'Million'],
        [1000, 'Thousand'],
      ];

  const parts: string[] = [];
  for (const [size, label] of scales) {
    const scale = Number(size);
    if (n >= scale) {
      const chunk = Math.floor(n / scale);
      const chunkWords =
        chunk >= 1000 ? integerToWords(chunk, indian) : wordsBelowThousand(chunk);
      parts.push(chunkWords + ' ' + label);
      n %= scale;
    }
  }
  if (n > 0) {
    parts.push(wordsBelowThousand(n));
  }
  return parts.join(' ');
}

export function amountInWords(amount: number, currency: string): string {
  const info = currencyInfo(currency);
  const cents = Math.round(Math.abs(amount) * 100);
  const whole = Math.floor(cents / 100);
  const minor = cents % 100;

  let text = info.name + ' ' + integerToWords(whole, currency === 'INR');
  if (minor > 0) {
    text += ' and ' + wordsBelowThousand(minor) + ' ' + info.minor;
  }
  return text + ' Only';
}

/** Blend a hex colour towards white; amount 0..1 is how much white. */
export function hexTint(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number): number => Math.round(c + (255 - c) * amount);
  return '#' + [mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/** Readable text colour (dark or white) on top of the given background. */
export function hexOnColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#111111' : '#FFFFFF';
}

export function formatQty(q: number): string {
  return q.toFixed(3).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPct(p: number): string {
  return p.toFixed(2).replace(/\.?0+$/, '') + '%';
}
