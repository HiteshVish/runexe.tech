import {
  AMBIGUOUS_CHARS,
  CHARSET,
  DEFAULT_SYMBOLS,
  MAX_PASSPHRASE_WORDS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSPHRASE_WORDS,
  MIN_PASSWORD_LENGTH,
} from "./constants";
import { EFF_WORDS } from "./wordlist";
import { randomChoice, randomIndex, shuffleInPlace } from "./rng";
import type { PassphraseSeparator } from "./constants";

export type RandomPasswordOptions = {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  customSymbols: string;
  noRepeat: boolean;
};

export type PassphraseOptions = {
  wordCount: number;
  separator: PassphraseSeparator;
  capitalize: boolean;
  numberSuffix: boolean;
};

export type GenerateResult = { value: string; error?: string };

function filterAmbiguous(charset: string): string {
  return [...charset].filter((c) => !AMBIGUOUS_CHARS.has(c)).join("");
}

export function buildCharset(opts: RandomPasswordOptions): { pool: string; pools: string[]; error?: string } {
  const pools: string[] = [];
  let symbols = opts.customSymbols.trim() || DEFAULT_SYMBOLS;
  if (opts.symbols && symbols) pools.push(symbols);
  if (opts.upper) pools.push(CHARSET.upper);
  if (opts.lower) pools.push(CHARSET.lower);
  if (opts.digits) pools.push(CHARSET.digits);

  if (!pools.length) {
    return { pool: "", pools: [], error: "Turn on at least one character type." };
  }

  let pool = pools.join("");
  if (opts.excludeAmbiguous) pool = filterAmbiguous(pool);
  pool = [...new Set(pool)].join("");
  if (!pool.length) {
    return { pool: "", pools: [], error: "No characters left after excluding ambiguous ones." };
  }

  const len = Math.min(
    MAX_PASSWORD_LENGTH,
    Math.max(MIN_PASSWORD_LENGTH, Math.floor(opts.length) || 16),
  );
  if (opts.noRepeat && pool.length < len) {
    return {
      pool,
      pools,
      error: `Need at least ${len} unique characters; only ${pool.length} available. Shorten the password or turn off “no repeated characters”.`,
    };
  }

  return { pool, pools };
}

export function generatePassword(opts: RandomPasswordOptions): GenerateResult {
  const len = Math.min(MAX_PASSWORD_LENGTH, Math.max(MIN_PASSWORD_LENGTH, Math.floor(opts.length) || 16));
  const { pool, pools, error } = buildCharset({ ...opts, length: len });
  if (error) return { value: "", error };

  const chars: string[] = [];

  for (const p of pools) {
    let set = opts.excludeAmbiguous ? filterAmbiguous(p) : p;
    set = [...new Set(set)].join("");
    if (!set) continue;
    chars.push(set[randomIndex(set.length)]);
  }

  const used = new Set(chars);
  while (chars.length < len) {
    const c = pool[randomIndex(pool.length)];
    if (opts.noRepeat) {
      if (used.has(c)) continue;
      used.add(c);
    }
    chars.push(c);
  }

  shuffleInPlace(chars);
  return { value: chars.join("") };
}

function formatWord(word: string, capitalize: boolean): string {
  if (!capitalize) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function generatePassphrase(opts: PassphraseOptions): GenerateResult {
  const n = Math.min(MAX_PASSPHRASE_WORDS, Math.max(MIN_PASSPHRASE_WORDS, Math.floor(opts.wordCount) || 5));
  const picked: string[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (picked.length < n && guard++ < n * 50) {
    const w = randomChoice(EFF_WORDS);
    if (used.has(w)) continue;
    used.add(w);
    picked.push(formatWord(w, opts.capitalize));
  }
  if (picked.length < n) {
    while (picked.length < n) picked.push(formatWord(randomChoice(EFF_WORDS), opts.capitalize));
  }
  let value = picked.join(opts.separator);
  if (opts.numberSuffix) {
    const suffix = randomIndex(10000).toString().padStart(4, "0");
    value += opts.separator ? `${opts.separator}${suffix}` : suffix;
  }
  return { value };
}

export type Strength = "weak" | "fair" | "strong" | "very-strong";

export function entropyBitsRandom(opts: RandomPasswordOptions, length: number): number {
  const { pool } = buildCharset({ ...opts, length });
  if (!pool.length) return 0;
  return Math.log2(pool.length) * length;
}

export function entropyBitsPassphrase(wordCount: number, listSize = EFF_WORDS.length): number {
  return Math.log2(listSize) * wordCount + (wordCount > 0 ? Math.log2(listSize) : 0) * 0; // words only
}

export function strengthFromBits(bits: number): Strength {
  if (bits < 40) return "weak";
  if (bits < 60) return "fair";
  if (bits < 80) return "strong";
  return "very-strong";
}

export function strengthLabel(s: Strength): string {
  return { weak: "Weak", fair: "Fair", strong: "Strong", "very-strong": "Very strong" }[s];
}

export function crackHint(bits: number): string {
  if (bits < 40) return "Rough estimate: could fall to a fast offline attack in days to weeks (this is only a ballpark).";
  if (bits < 60) return "Rough estimate: months to years for a determined attacker with common hardware.";
  if (bits < 80) return "Rough estimate: years to decades — suitable for most accounts.";
  return "Rough estimate: centuries or longer at typical attack rates — still use a unique password per site.";
}