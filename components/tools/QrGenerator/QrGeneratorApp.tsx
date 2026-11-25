"use client";

import DevToolHeader from "@/components/tools/DevToolHeader";
import { contrastWarnings } from "@/lib/qr/contrast";
import { defaultCustomize, defaultFormState, FILENAME_PREFIX } from "@/lib/qr/constants";
import type { QrLandingSlug } from "@/lib/qr/landing-meta";
import { resolvePayload } from "@/lib/qr/payloads";
import {
  copyCanvasToClipboard,
  downloadBlob,
  downloadText,
  renderQrToCanvas,
  renderQrSvg,
  renderShopSignPng,
} from "@/lib/qr/render";
import type { QrFormState, QrType, QrCustomize } from "@/lib/qr/types";
import "@/styles/qr-generator.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Customizer from "./Customizer";
import DownloadBar from "./DownloadBar";
import Preview from "./Preview";
import QrLandingNav from "./QrLandingNav";
import StepsExplainer from "./StepsExplainer";
import TypeForm from "./TypeForm";
import TypeTabs from "./TypeTabs";

export type QrGeneratorAppProps = {
  headerTitle?: string;
  headerLead?: string;
  initialType?: QrType;
  showLandingNav?: boolean;
  currentLanding?: QrLandingSlug;
};

export default function QrGeneratorApp({
  headerTitle = "QR Code Generator",
  headerLead = "Create URL, WiFi, WhatsApp, and UPI QR codes. Runs in your browser — nothing is uploaded or stored.",
  initialType = "url",
  showLandingNav = true,
  currentLanding,
}: QrGeneratorAppProps) {
  const [type, setType] = useState<QrType>(initialType);
  const [showMore, setShowMore] = useState(
    initialType === "email" || initialType === "tel" || initialType === "sms",
  );
  const [form, setForm] = useState<QrFormState>(() => defaultFormState());
  const [custom, setCustom] = useState<QrCustomize>(() => defaultCustomize());
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [clipboardOk, setClipboardOk] = useState<boolean | null>(null);
  const [renderedBg, setRenderedBg] = useState<string>("#ffffff");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const payloadRef = useRef<string | null>(null);
  const renderSeq = useRef(0);

  const contrast = useMemo(() => contrastWarnings(custom.fgColor, custom.bgColor), [custom.fgColor, custom.bgColor]);

  const fieldErrors = useMemo(() => {
    const m: Record<string, string> = {};
    if (errors.length) {
      if (type === "url") m.url = errors[0];
      if (type === "text") m.text = errors[0];
      if (type === "wifi") m.wifiSsid = errors[0];
      if (type === "whatsapp") m.whatsappPhone = errors[0];
      if (type === "upi") {
        if (errors[0].includes("UPI")) m.upiVpa = errors[0];
        else if (errors[0].includes("Payee")) m.upiName = errors[0];
        else if (errors[0].includes("Amount")) m.upiAmount = errors[0];
      }
    }
    return m;
  }, [errors, type]);

  const renderQr = useCallback(async () => {
    const seq = ++renderSeq.current;
    const result = resolvePayload(type, form);
    const allWarnings = [...result.warnings, ...contrast];
    if (!result.payload) {
      if (seq === renderSeq.current) {
        setReady(false);
        setErrors(result.errors);
        setWarnings(allWarnings);
        payloadRef.current = null;
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const meta = await renderQrToCanvas(canvas, {
        payload: result.payload,
        ...custom,
        logo,
      });
      if (seq === renderSeq.current) {
        payloadRef.current = result.payload;
        setErrors([]);
        const extra = meta.scanAdjusted
          ? ["Colors were tuned for reliable scanning — download matches the preview."]
          : [];
        setWarnings([...allWarnings, ...extra]);
        setRenderedBg(meta.bg);
        setReady(true);
      }
    } catch {
      if (seq === renderSeq.current) {
        setReady(false);
        setErrors(["Could not render this QR. Try shorter text or lower error correction."]);
        payloadRef.current = null;
      }
    }
  }, [type, form, custom, logo, contrast]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void renderQr();
    }, 200);
    return () => clearTimeout(t);
  }, [renderQr]);

  function onLogo(file: File | null) {
    if (!file) {
      setLogo(null);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      setLogo(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setLogo(null);
    };
    img.src = url;
  }

  const prefix = FILENAME_PREFIX[type];
  const canDownload = ready && payloadRef.current;

  async function handlePng() {
    const canvas = canvasRef.current;
    if (!canvas || !canDownload) return;
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (blob) downloadBlob(blob, `${prefix}-qr-code.png`);
  }

  async function handleSvg() {
    const payload = payloadRef.current;
    if (!payload) return;
    const svg = await renderQrSvg(payload, custom, logo);
    downloadText(svg, `${prefix}-qr-code.svg`, "image/svg+xml");
  }

  async function handleClipboard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ok = await copyCanvasToClipboard(canvas);
    setClipboardOk(ok);
  }

  async function handleShopSign() {
    const payload = payloadRef.current;
    if (!payload || type !== "upi") return;
    const blob = await renderShopSignPng(payload, form.upiName, custom);
    downloadBlob(blob, "upi-shop-sign.png");
  }

  return (
    <div className="dt-page tool-page qr-page">
      <div className="dt-wrap">
        <DevToolHeader
          title={headerTitle}
          lead={headerLead}
          badges={["Runs in your browser", "Nothing is uploaded", "No signup"]}
        />
        <p className="qr-privacy">Runs in your browser. Nothing is uploaded or stored.</p>
        <StepsExplainer />
        <div className="qr-layout">
          <div className="dt-panel">
            <TypeTabs type={type} showMore={showMore} onChange={setType} onToggleMore={setShowMore} />
            <p className="qr-section-title">Content</p>
            <TypeForm type={type} form={form} onChange={(p) => setForm((s) => ({ ...s, ...p }))} fieldErrors={fieldErrors} />
            <Customizer
              custom={custom}
              hasLogo={!!logo}
              onChange={(p) => setCustom((s) => ({ ...s, ...p }))}
              onLogo={onLogo}
              contrastWarnings={contrast}
            />
          </div>
          <div className="dt-panel">
            <Preview
              canvasRef={canvasRef}
              ready={ready}
              errors={errors}
              warnings={warnings}
              previewBg={renderedBg}
            />
            <DownloadBar
              disabled={!canDownload}
              showShopSign={type === "upi" && ready}
              onPng={() => void handlePng()}
              onSvg={() => void handleSvg()}
              onClipboard={() => void handleClipboard()}
              onShopSign={() => void handleShopSign()}
              clipboardOk={clipboardOk}
            />
          </div>
        </div>
        {showLandingNav && <QrLandingNav currentLanding={currentLanding} />}
      </div>
    </div>
  );
}