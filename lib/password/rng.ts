/** Cryptographically secure random helpers. Never use Math.random. */

function secureCrypto(): Crypto {
  if (typeof globalThis.crypto?.getRandomValues === "function") return globalThis.crypto;
  throw new Error("Web Crypto API is not available in this environment.");
}

export function getRandomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  secureCrypto().getRandomValues(buf);
  return buf;
}

/** Unbiased index in [0, max) via rejection sampling. */
export function randomIndex(max: number): number {
  if (max <= 0) throw new RangeError("max must be positive");
  if (max === 1) return 0;
  const limit = Math.floor(256 / max) * max;
  const buf = new Uint8Array(1);
  let x: number;
  do {
    secureCrypto().getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

export function randomChoice<T>(items: readonly T[]): T {
  return items[randomIndex(items.length)];
}

/** Fisher–Yates shuffle in place using secure RNG. */
export function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}