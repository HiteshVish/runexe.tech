export type QrType =
  | "url"
  | "text"
  | "wifi"
  | "whatsapp"
  | "upi"
  | "email"
  | "tel"
  | "sms";

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type EccLevel = "L" | "M" | "Q" | "H";

export type QrFormState = {
  url: string;
  text: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiSecurity: WifiSecurity;
  wifiHidden: boolean;
  whatsappCountry: string;
  whatsappPhone: string;
  whatsappMessage: string;
  upiVpa: string;
  upiName: string;
  upiAmount: string;
  upiNote: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  telNumber: string;
  smsNumber: string;
  smsBody: string;
};

export type PayloadResult = {
  payload: string | null;
  errors: string[];
  warnings: string[];
};

export type QrCustomize = {
  fgColor: string;
  bgColor: string;
  size: number;
  margin: number;
  ecc: EccLevel;
};