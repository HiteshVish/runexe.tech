import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const CRIMSON = "#D45C5C";

let logoPromise: Promise<string> | null = null;
function logoDataUrl() {
  logoPromise ??= readFile(path.join(process.cwd(), "public/assets/logo-trimmed-dark.png")).then(
    (buf) => `data:image/png;base64,${buf.toString("base64")}`,
  );
  return logoPromise;
}

type OgProps = { kicker: string; title: string; subtitle: string };

export async function renderOgImage({ kicker, title, subtitle }: OgProps) {
  const logo = await logoDataUrl();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#070707",
          backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
          color: "#F4F1EC",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 28, left: 28, width: 28, height: 28, borderTop: `3px solid ${CRIMSON}`, borderLeft: `3px solid ${CRIMSON}` }} />
        <div style={{ position: "absolute", top: 28, right: 28, width: 28, height: 28, borderTop: `3px solid ${CRIMSON}`, borderRight: `3px solid ${CRIMSON}` }} />
        <div style={{ position: "absolute", bottom: 28, left: 28, width: 28, height: 28, borderBottom: `3px solid ${CRIMSON}`, borderLeft: `3px solid ${CRIMSON}` }} />
        <div style={{ position: "absolute", bottom: 28, right: 28, width: 28, height: 28, borderBottom: `3px solid ${CRIMSON}`, borderRight: `3px solid ${CRIMSON}` }} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={340} height={80} style={{ objectFit: "contain", objectPosition: "left" }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, color: CRIMSON, fontSize: 24, letterSpacing: 6, textTransform: "uppercase" }}>
            {kicker}
            <div style={{ width: 80, height: 3, background: CRIMSON }} />
          </div>
          <div style={{ marginTop: 22, fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>
            {title}
          </div>
          <div style={{ marginTop: 22, fontSize: 30, color: "rgba(244,241,236,0.68)", maxWidth: 980, lineHeight: 1.35 }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 4, color: "rgba(244,241,236,0.5)", textTransform: "uppercase" }}>
          <div>runexe.tech</div>
          <div style={{ color: CRIMSON }}>Engineering that executes.</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
