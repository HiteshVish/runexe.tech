export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const DEFAULT_PASSWORD_LENGTH = 16;

export const AMBIGUOUS_CHARS = new Set(["O", "0", "l", "1", "I", "|"]);

export const CHARSET = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
} as const;

export const DEFAULT_SYMBOLS = CHARSET.symbols;

export const MIN_PASSPHRASE_WORDS = 3;
export const MAX_PASSPHRASE_WORDS = 10;
export const DEFAULT_PASSPHRASE_WORDS = 5;

export type PassphraseSeparator = "-" | "." | " " | "";

export const SEPARATOR_OPTIONS: { value: PassphraseSeparator; label: string }[] = [
  { value: "-", label: "Hyphen (-)" },
  { value: ".", label: "Dot (.)" },
  { value: " ", label: "Space" },
  { value: "", label: "None" },
];