"use client";

import { WHATSAPP_COUNTRIES } from "@/lib/qr/constants";
import type { QrFormState, QrType, WifiSecurity } from "@/lib/qr/types";
import { useState } from "react";

type Props = {
  type: QrType;
  form: QrFormState;
  onChange: (patch: Partial<QrFormState>) => void;
  fieldErrors: Record<string, string>;
};

export default function TypeForm({ type, form, onChange, fieldErrors }: Props) {
  const [showWifiPw, setShowWifiPw] = useState(false);
  const invalid = (name: string) => (fieldErrors[name] ? "field-invalid" : "");

  switch (type) {
    case "url":
      return (
        <label className="dt-field">
          URL
          <input
            className={`dt-input ${invalid("url")}`}
            type="url"
            placeholder="https://runexe.tech"
            value={form.url}
            onChange={(e) => onChange({ url: e.target.value })}
            autoComplete="off"
          />
          <span className="qr-hint">We add https:// if you omit the scheme.</span>
        </label>
      );
    case "text":
      return (
        <label className="dt-field">
          Text
          <textarea
            className={`dt-input ${invalid("text")}`}
            rows={5}
            value={form.text}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </label>
      );
    case "wifi":
      return (
        <div className="dt-stack">
          <label className="dt-field">
            Network name (SSID)
            <input
              className={`dt-input ${invalid("wifiSsid")}`}
              value={form.wifiSsid}
              onChange={(e) => onChange({ wifiSsid: e.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="dt-field">
            Security
            <select
              className="dt-input"
              value={form.wifiSecurity}
              onChange={(e) => onChange({ wifiSecurity: e.target.value as WifiSecurity })}
            >
              <option value="WPA">WPA / WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None (open)</option>
            </select>
          </label>
          {form.wifiSecurity !== "nopass" && (
            <label className="dt-field">
              Password
              <input
                className={`dt-input ${invalid("wifiPassword")}`}
                type={showWifiPw ? "text" : "password"}
                value={form.wifiPassword}
                onChange={(e) => onChange({ wifiPassword: e.target.value })}
                autoComplete="off"
              />
              <div className="qr-pw-toggle">
                <button type="button" onClick={() => setShowWifiPw((v) => !v)}>
                  {showWifiPw ? "Hide" : "Show"} password
                </button>
              </div>
            </label>
          )}
          <label className="dt-check">
            <input
              type="checkbox"
              checked={form.wifiHidden}
              onChange={(e) => onChange({ wifiHidden: e.target.checked })}
            />
            Hidden network
          </label>
        </div>
      );
    case "whatsapp":
      return (
        <div className="dt-stack">
          <div className="ic-row2">
            <label className="dt-field">
              Country
              <select
                className="dt-input"
                value={form.whatsappCountry}
                onChange={(e) => onChange({ whatsappCountry: e.target.value })}
              >
                {WHATSAPP_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="dt-field">
              Phone number
              <input
                className={`dt-input ${invalid("whatsappPhone")}`}
                inputMode="tel"
                placeholder="9876543210"
                value={form.whatsappPhone}
                onChange={(e) => onChange({ whatsappPhone: e.target.value })}
                autoComplete="off"
              />
            </label>
          </div>
          <label className="dt-field">
            Pre-filled message (optional)
            <textarea
              className="dt-input"
              rows={3}
              value={form.whatsappMessage}
              onChange={(e) => onChange({ whatsappMessage: e.target.value })}
            />
          </label>
        </div>
      );
    case "upi":
      return (
        <div className="dt-stack">
          <label className="dt-field">
            UPI ID / VPA
            <input
              className={`dt-input ${invalid("upiVpa")}`}
              placeholder="shopname@okhdfcbank"
              value={form.upiVpa}
              onChange={(e) => onChange({ upiVpa: e.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="dt-field">
            Payee name
            <input
              className={`dt-input ${invalid("upiName")}`}
              value={form.upiName}
              onChange={(e) => onChange({ upiName: e.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="dt-field">
            Amount (optional, INR)
            <input
              className={`dt-input ${invalid("upiAmount")}`}
              inputMode="decimal"
              placeholder="Leave empty for customer to enter"
              value={form.upiAmount}
              onChange={(e) => onChange({ upiAmount: e.target.value })}
              autoComplete="off"
            />
            <span className="qr-hint">
              Leave blank for a reusable shop QR — customers enter the amount when they scan.
            </span>
          </label>
          <label className="dt-field">
            Transaction note (optional)
            <input
              className="dt-input"
              value={form.upiNote}
              onChange={(e) => onChange({ upiNote: e.target.value })}
              autoComplete="off"
            />
          </label>
          <p className="qr-note-warn" role="note">
            Always scan-test the QR with your own UPI app before printing or displaying it.
          </p>
        </div>
      );
    case "email":
      return (
        <div className="dt-stack">
          <label className="dt-field">
            To
            <input
              className={`dt-input ${invalid("emailTo")}`}
              type="email"
              value={form.emailTo}
              onChange={(e) => onChange({ emailTo: e.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="dt-field">
            Subject (optional)
            <input className="dt-input" value={form.emailSubject} onChange={(e) => onChange({ emailSubject: e.target.value })} />
          </label>
          <label className="dt-field">
            Body (optional)
            <textarea className="dt-input" rows={3} value={form.emailBody} onChange={(e) => onChange({ emailBody: e.target.value })} />
          </label>
        </div>
      );
    case "tel":
      return (
        <label className="dt-field">
          Phone number
          <input
            className={`dt-input ${invalid("telNumber")}`}
            type="tel"
            value={form.telNumber}
            onChange={(e) => onChange({ telNumber: e.target.value })}
            autoComplete="off"
          />
        </label>
      );
    case "sms":
      return (
        <div className="dt-stack">
          <label className="dt-field">
            Phone number
            <input
              className={`dt-input ${invalid("smsNumber")}`}
              type="tel"
              value={form.smsNumber}
              onChange={(e) => onChange({ smsNumber: e.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="dt-field">
            Message (optional)
            <textarea className="dt-input" rows={3} value={form.smsBody} onChange={(e) => onChange({ smsBody: e.target.value })} />
          </label>
        </div>
      );
    default:
      return null;
  }
}