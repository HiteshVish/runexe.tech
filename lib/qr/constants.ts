import type { EccLevel, QrFormState, QrType } from "./types";

export const OUTPUT_SIZES = [256, 512, 1024, 2048] as const;

export const ECC_LEVELS: EccLevel[] = ["L", "M", "Q", "H"];

export const DEFAULT_FG = "#000000";
export const DEFAULT_BG = "#ffffff";
export const DEFAULT_MARGIN = 4;
export const DEFAULT_ECC: EccLevel = "M";
export const DEFAULT_SIZE = 512;
export const PAYLOAD_LENGTH_WARN = 1000;

export const VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export const MAIN_QR_TYPES: QrType[] = ["url", "text", "wifi", "whatsapp", "upi"];
export const MORE_QR_TYPES: QrType[] = ["email", "tel", "sms"];

export const QR_TYPE_LABELS: Record<QrType, string> = {
  url: "Link / URL",
  text: "Plain text",
  wifi: "WiFi",
  whatsapp: "WhatsApp",
  upi: "UPI payment",
  email: "Email",
  tel: "Phone call",
  sms: "SMS",
};

export const FILENAME_PREFIX: Record<QrType, string> = {
  url: "url",
  text: "text",
  wifi: "wifi",
  whatsapp: "whatsapp",
  upi: "upi",
  email: "email",
  tel: "phone",
  sms: "sms",
};

/** Dial codes for WhatsApp (display + value without +). */
export const WHATSAPP_COUNTRIES: { code: string; label: string }[] = [
  { code: "91", label: "India (+91)" },
  { code: "1", label: "US / Canada (+1)" },
  { code: "44", label: "UK (+44)" },
  { code: "971", label: "UAE (+971)" },
  { code: "65", label: "Singapore (+65)" },
  { code: "61", label: "Australia (+61)" },
  { code: "49", label: "Germany (+49)" },
  { code: "33", label: "France (+33)" },
];

export const DEFAULT_WHATSAPP_COUNTRY = "91";

export function defaultFormState(): QrFormState {
  return {
    url: "",
    text: "",
    wifiSsid: "",
    wifiPassword: "",
    wifiSecurity: "WPA",
    wifiHidden: false,
    whatsappCountry: DEFAULT_WHATSAPP_COUNTRY,
    whatsappPhone: "",
    whatsappMessage: "",
    upiVpa: "",
    upiName: "",
    upiAmount: "",
    upiNote: "",
    emailTo: "",
    emailSubject: "",
    emailBody: "",
    telNumber: "",
    smsNumber: "",
    smsBody: "",
  };
}

export function defaultCustomize() {
  return {
    fgColor: DEFAULT_FG,
    bgColor: DEFAULT_BG,
    size: DEFAULT_SIZE,
    margin: DEFAULT_MARGIN,
    ecc: DEFAULT_ECC,
  };
}